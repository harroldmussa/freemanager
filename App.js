import { useEffect, useState, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { setLogLevel } from 'firebase/firestore';

// Set Firebase log level for debugging
setLogLevel('debug');

// Global variables for Firebase configuration and authentication
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The main application component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [boards, setBoards] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [activeBoardData, setActiveBoardData] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [activeListId, setActiveListId] = useState(null);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editedCardContent, setEditedCardContent] = useState('');
  const [editingListTitle, setEditingListTitle] = useState(null);
  const [editedListTitle, setEditedListTitle] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [deletingBoardId, setDeletingBoardId] = useState(null);

  // Firestore & Auth initialization
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const dbInstance = getFirestore(app);
        const authInstance = getAuth(app);
        setDb(dbInstance);
        setAuth(authInstance);

        onAuthStateChanged(authInstance, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            const anonymousUser = await signInAnonymously(authInstance);
            setUserId(anonymousUser.user.uid);
          }
          setIsAuthReady(true);
        });

        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    };
    initializeFirebase();
  }, []);

  // Fetch boards data
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const boardsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/boards`);
    const unsubscribe = onSnapshot(boardsCollectionRef, (snapshot) => {
      const fetchedBoards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBoards(fetchedBoards);
    }, (error) => {
      console.error("Error fetching boards: ", error);
    });

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  // Fetch active board data
  useEffect(() => {
    if (!db || !userId || !activeBoardId) return;

    setBoardLoading(true);
    const boardDocRef = doc(db, `artifacts/${appId}/users/${userId}/boards/${activeBoardId}`);
    const unsubscribe = onSnapshot(boardDocRef, async (boardDoc) => {
      if (boardDoc.exists()) {
        const boardData = boardDoc.data();
        const listsCollectionRef = collection(db, `artifacts/${appId}/boards/${activeBoardId}/lists`);
        const listsSnapshot = await getDocs(query(listsCollectionRef));
        const fetchedLists = await Promise.all(listsSnapshot.docs.map(async (listDoc) => {
          const listData = listDoc.data();
          const cardsCollectionRef = collection(db, `artifacts/${appId}/lists/${listDoc.id}/cards`);
          const cardsSnapshot = await getDocs(query(cardsCollectionRef));
          const fetchedCards = cardsSnapshot.docs.map(cardDoc => ({
            id: cardDoc.id,
            ...cardDoc.data()
          }));
          return {
            id: listDoc.id,
            ...listData,
            cards: fetchedCards.sort((a, b) => a.order - b.order)
          };
        }));
        setActiveBoardData({
          ...boardData,
          lists: fetchedLists.sort((a, b) => a.order - b.order)
        });
      }
      setBoardLoading(false);
    }, (error) => {
      console.error("Error fetching board data: ", error);
      setBoardLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, activeBoardId]);

  // DND-Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper functions
  const handleBoardClick = (boardId) => {
    setActiveBoardId(boardId);
  };

  const handleCreateBoard = async () => {
    if (!db || !userId || !newBoardName) return;
    try {
      const boardsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/boards`);
      const newBoardRef = doc(boardsCollectionRef);
      await setDoc(newBoardRef, {
        name: newBoardName,
        createdAt: new Date(),
        userId: userId,
      });
      setShowAddBoardModal(false);
      setNewBoardName('');
      setActiveBoardId(newBoardRef.id);
    } catch (e) {
      console.error("Error adding board: ", e);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!db || !userId) return;
    try {
      setDeletingBoardId(boardId);
      setShowDeleteConfirmation(true);
    } catch (e) {
      console.error("Error setting board for deletion: ", e);
    }
  };

  const confirmDeleteBoard = async () => {
    if (!db || !userId || !deletingBoardId) return;
    try {
      // First, delete all lists and their cards associated with the board
      const listsCollectionRef = collection(db, `artifacts/${appId}/boards/${deletingBoardId}/lists`);
      const listsSnapshot = await getDocs(query(listsCollectionRef));
      const deletionPromises = listsSnapshot.docs.map(async (listDoc) => {
        const cardsCollectionRef = collection(db, `artifacts/${appId}/lists/${listDoc.id}/cards`);
        const cardsSnapshot = await getDocs(query(cardsCollectionRef));
        const cardDeletionPromises = cardsSnapshot.docs.map(cardDoc => deleteDoc(doc(cardsCollectionRef, cardDoc.id)));
        await Promise.all(cardDeletionPromises);
        return deleteDoc(doc(listsCollectionRef, listDoc.id));
      });
      await Promise.all(deletionPromises);

      // Then delete the board document
      const boardDocRef = doc(db, `artifacts/${appId}/users/${userId}/boards/${deletingBoardId}`);
      await deleteDoc(boardDocRef);

      setActiveBoardId(null);
      setShowDeleteConfirmation(false);
      setDeletingBoardId(null);
    } catch (e) {
      console.error("Error deleting board: ", e);
    }
  };

  const handleAddList = async () => {
    if (!db || !activeBoardId || !newListTitle) return;
    try {
      const listsCollectionRef = collection(db, `artifacts/${appId}/boards/${activeBoardId}/lists`);
      const newOrder = activeBoardData.lists.length > 0 ? Math.max(...activeBoardData.lists.map(l => l.order)) + 1 : 0;
      await setDoc(doc(listsCollectionRef), {
        title: newListTitle,
        order: newOrder,
        boardId: activeBoardId,
      });
      setShowAddListModal(false);
      setNewListTitle('');
    } catch (e) {
      console.error("Error adding list: ", e);
    }
  };

  const handleUpdateListTitle = async (listId) => {
    if (!db || !activeBoardId || !listId || !editedListTitle) return;
    try {
      const listDocRef = doc(db, `artifacts/${appId}/boards/${activeBoardId}/lists/${listId}`);
      await updateDoc(listDocRef, {
        title: editedListTitle,
      });
      setEditingListTitle(null);
      setEditedListTitle('');
    } catch (e) {
      console.error("Error updating list title: ", e);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!db) return;
    setDeletingListId(listId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteList = async () => {
    if (!db || !deletingListId) return;
    try {
      const batch = writeBatch(db);
      // Delete all cards within the list first
      const cardsCollectionRef = collection(db, `artifacts/${appId}/lists/${deletingListId}/cards`);
      const cardsSnapshot = await getDocs(query(cardsCollectionRef));
      cardsSnapshot.docs.forEach(cardDoc => {
        batch.delete(doc(cardsCollectionRef, cardDoc.id));
      });
      // Then delete the list document
      const listDocRef = doc(db, `artifacts/${appId}/boards/${activeBoardId}/lists/${deletingListId}`);
      batch.delete(listDocRef);

      await batch.commit();

      setShowDeleteConfirmation(false);
      setDeletingListId(null);
    } catch (e) {
      console.error("Error deleting list: ", e);
    }
  };

  const handleAddCard = async () => {
    if (!db || !activeListId || !newCardContent) return;
    try {
      const cardsCollectionRef = collection(db, `artifacts/${appId}/lists/${activeListId}/cards`);
      const newCardOrder = activeBoardData.lists.find(l => l.id === activeListId).cards.length > 0
        ? Math.max(...activeBoardData.lists.find(l => l.id === activeListId).cards.map(c => c.order)) + 1
        : 0;
      await setDoc(doc(cardsCollectionRef), {
        content: newCardContent,
        order: newCardOrder,
        listId: activeListId,
      });
      setShowAddCardModal(false);
      setNewCardContent('');
    } catch (e) {
      console.error("Error adding card: ", e);
    }
  };

  const handleUpdateCard = async () => {
    if (!db || !editingCard || !editedCardContent) return;
    try {
      const cardDocRef = doc(db, `artifacts/${appId}/lists/${editingCard.listId}/cards/${editingCard.id}`);
      await updateDoc(cardDocRef, {
        content: editedCardContent,
      });
      setShowEditCardModal(false);
      setEditingCard(null);
      setEditedCardContent('');
    } catch (e) {
      console.error("Error updating card: ", e);
    }
  };

  const handleDeleteCard = async (cardId, listId) => {
    if (!db) return;
    try {
      const cardDocRef = doc(db, `artifacts/${appId}/lists/${listId}/cards/${cardId}`);
      await deleteDoc(cardDocRef);
    } catch (e) {
      console.error("Error deleting card: ", e);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || !db) return;

    if (active.id === over.id) {
      return;
    }
  
    if (active.data.current.type === 'list' && over.data.current.type === 'list') {
      const oldIndex = activeBoardData.lists.findIndex(list => list.id === active.id);
      const newIndex = activeBoardData.lists.findIndex(list => list.id === over.id);
      const newLists = arrayMove(activeBoardData.lists, oldIndex, newIndex);
      
      setActiveBoardData(prev => ({
        ...prev,
        lists: newLists
      }));
  
      const batch = writeBatch(db);
      newLists.forEach((list, index) => {
        const listDocRef = doc(db, `artifacts/${appId}/boards/${activeBoardId}/lists/${list.id}`);
        batch.update(listDocRef, { order: index });
      });
      await batch.commit();
    } else if (active.data.current.type === 'card' && over.data.current.type === 'card') {
      const activeList = activeBoardData.lists.find(l => l.id === active.data.current.listId);
      const overList = activeBoardData.lists.find(l => l.id === over.data.current.listId);
  
      if (activeList.id === overList.id) {
        const oldIndex = activeList.cards.findIndex(card => card.id === active.id);
        const newIndex = overList.cards.findIndex(card => card.id === over.id);
        const newCards = arrayMove(activeList.cards, oldIndex, newIndex);
  
        const newLists = activeBoardData.lists.map(list =>
          list.id === activeList.id ? { ...list, cards: newCards } : list
        );
  
        setActiveBoardData(prev => ({
          ...prev,
          lists: newLists
        }));
  
        const batch = writeBatch(db);
        newCards.forEach((card, index) => {
          const cardDocRef = doc(db, `artifacts/${appId}/lists/${activeList.id}/cards/${card.id}`);
          batch.update(cardDocRef, { order: index });
        });
        await batch.commit();
      } else {
        const draggedCard = active.data.current.card;
        
        // Remove card from old list
        const updatedOldListCards = activeList.cards.filter(card => card.id !== draggedCard.id);
  
        // Add card to new list
        const overIndex = overList.cards.findIndex(card => card.id === over.id);
        const updatedNewListCards = [...overList.cards.slice(0, overIndex), draggedCard, ...overList.cards.slice(overIndex)];
  
        const newLists = activeBoardData.lists.map(list => {
          if (list.id === activeList.id) {
            return { ...list, cards: updatedOldListCards };
          }
          if (list.id === overList.id) {
            return { ...list, cards: updatedNewListCards };
          }
          return list;
        });
  
        setActiveBoardData(prev => ({
          ...prev,
          lists: newLists
        }));
  
        const batch = writeBatch(db);
  
        // Update card's listId in Firestore
        batch.update(doc(db, `artifacts/${appId}/lists/${activeList.id}/cards/${draggedCard.id}`), {
          listId: overList.id
        });
  
        // Update order for both lists
        updatedOldListCards.forEach((card, index) => {
          batch.update(doc(db, `artifacts/${appId}/lists/${activeList.id}/cards/${card.id}`), { order: index });
        });
        updatedNewListCards.forEach((card, index) => {
          batch.update(doc(db, `artifacts/${appId}/lists/${overList.id}/cards/${card.id}`), { order: index });
        });
  
        await batch.commit();
      }
    }
  };

  const Card = ({ card, listId }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: card.id,
      data: { type: 'card', card, listId },
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 group my-2"
        onClick={() => {
          setShowEditCardModal(true);
          setEditingCard({ ...card, listId });
          setEditedCardContent(card.content);
        }}
      >
        <p className="text-sm font-medium text-gray-800">{card.content}</p>
        <button
          className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCard(card.id, listId);
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  const List = ({ list }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: list.id,
      data: { type: 'list' },
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="w-72 flex-shrink-0 bg-gray-100 p-4 rounded-xl shadow-lg flex flex-col h-full"
      >
        <div className="flex justify-between items-center mb-4">
          {editingListTitle === list.id ? (
            <input
              type="text"
              value={editedListTitle}
              onChange={(e) => setEditedListTitle(e.target.value)}
              onBlur={() => handleUpdateListTitle(list.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateListTitle(list.id);
                  e.target.blur();
                }
              }}
              className="font-bold text-xl text-gray-800 bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full"
            />
          ) : (
            <h3
              className="font-bold text-xl text-gray-800 cursor-pointer"
              onClick={() => {
                setEditingListTitle(list.id);
                setEditedListTitle(list.title);
              }}
            >
              {list.title}
            </h3>
          )}
          <div className="flex items-center gap-1">
            <button
              className="text-gray-500 hover:text-red-500"
              onClick={() => handleDeleteList(list.id)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 9v10H8V9h8m-1.5-6h-5L9 4H6v2h12V4h-3l-1.5-3zM18 7H6v13a2 2 0 002 2h8a2 2 0 002-2V7z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <SortableContext items={list.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {list.cards.map(card => (
              <Card key={card.id} card={card} listId={list.id} />
            ))}
          </SortableContext>
        </div>
        <button
          className="mt-4 w-full text-left text-gray-500 hover:text-indigo-600 transition-colors duration-200 flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200"
          onClick={() => {
            setShowAddCardModal(true);
            setActiveListId(list.id);
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z" />
          </svg>
          Add a card
        </button>
      </div>
    );
  };

  // Main render function
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white font-inter">
      {/* Sidebar for Boards */}
      <aside className="w-64 bg-gray-900 p-6 flex flex-col shadow-lg z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
            Open Trello
          </h1>
        </div>
        <div className="mb-6">
          <button
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={() => setShowAddBoardModal(true)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z" />
            </svg>
            Add Board
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {boards.length > 0 ? (
            <ul className="space-y-2">
              {boards.map((board) => (
                <li
                  key={board.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 group
                    ${activeBoardId === board.id ? 'bg-indigo-700 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'}`}
                  onClick={() => handleBoardClick(board.id)}
                >
                  <span className="truncate flex-1">{board.name}</span>
                  <button
                    className="ml-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 9v10H8V9h8m-1.5-6h-5L9 4H6v2h12V4h-3l-1.5-3zM18 7H6v13a2 2 0 002 2h8a2 2 0 002-2V7z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm text-center mt-8">No boards created yet.</p>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-gray-800 text-gray-500 text-xs">
          <p className="text-center">Logged in as:</p>
          <p className="font-mono break-all text-center mt-1 text-gray-400">{userId}</p>
        </div>
      </aside>

      {/* Main Board Content */}
      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        {activeBoardId ? (
          <>
            <h2 className="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
              {activeBoardData?.name}
            </h2>
            {boardLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400">Loading board...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={activeBoardData?.lists?.map(l => l.id) || []} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-6 items-start h-full pb-4">
                      {activeBoardData?.lists?.map(list => (
                        <List key={list.id} list={list} />
                      ))}
                      {activeBoardData && (
                        <div className="w-72 flex-shrink-0">
                          <button
                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
                            onClick={() => setShowAddListModal(true)}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z" />
                            </svg>
                            Add another list
                          </button>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 14v4H8v-4h6zm-4-9h6V4.5L13.5 4H10z" />
            </svg>
            <p className="text-xl font-medium">Select a board from the left or create a new one to get started.</p>
          </div>
        )}
      </main>

      {/* Add Board Modal */}
      {showAddBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 transform scale-100 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-4">Create a New Board</h3>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name"
              className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button
                className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                onClick={() => setShowAddBoardModal(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                onClick={handleCreateBoard}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 transform scale-100 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-4">Add a New List</h3>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="List title"
              className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button
                className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                onClick={() => setShowAddListModal(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                onClick={handleAddList}
              >
                Add List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 transform scale-100 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-4">Add a New Card</h3>
            <textarea
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              placeholder="Card content"
              className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
            />
            <div className="flex justify-end gap-3">
              <button
                className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                onClick={() => setShowAddCardModal(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                onClick={handleAddCard}
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {showEditCardModal && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 transform scale-100 transition-transform duration-300">
            <h3 className="text-2xl font-bold mb-4">Edit Card</h3>
            <textarea
              value={editedCardContent}
              onChange={(e) => setEditedCardContent(e.target.value)}
              placeholder="Card content"
              className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
            />
            <div className="flex justify-between items-center">
              <button
                className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                onClick={() => {
                  handleDeleteCard(editingCard.id, editingCard.listId);
                  setShowEditCardModal(false);
                }}
              >
                Delete Card
              </button>
              <div className="flex gap-3">
                <button
                  className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                  onClick={() => setShowEditCardModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                  onClick={handleUpdateCard}
                >
                  Update Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96">
            <h3 className="text-xl font-bold mb-4">Are you sure?</h3>
            <p className="text-gray-400 mb-6">
              This action cannot be undone. All data associated with this {deletingBoardId ? 'board' : 'list'} will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeletingListId(null);
                  setDeletingBoardId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                onClick={() => {
                  if (deletingBoardId) {
                    confirmDeleteBoard();
                  } else if (deletingListId) {
                    confirmDeleteList();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
