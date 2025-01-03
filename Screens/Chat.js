import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Video } from 'expo-av';
import { auth, db } from '../Services/FirebaseAuth';

export default function Chat({ route, navigation }) {
  const { user } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [userScrolling, setUserScrolling] = useState(false);

  const flatListRef = useRef(null);
  const currentUserId = auth.currentUser?.uid;

  if (!currentUserId) {
    console.error('User is not authenticated');
    navigation.navigate('login');
    return null;
  }

  if (!user) {
    console.error('User data is missing');
    navigation.goBack();
    return null;
  }

  const chatId =
    currentUserId < user.id
      ? `${currentUserId}_${user.id}`
      : `${user.id}_${currentUserId}`;

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('chatId', '==', chatId), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (content, type = 'text') => {
    if (content.trim() || type !== 'text') {
      try {
        if (editingMessage) {
          const messageRef = doc(db, 'messages', editingMessage.id);
          await updateDoc(messageRef, { content, edited: true });

          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === editingMessage.id ? { ...msg, content, edited: true } : msg
            )
          );

          setEditingMessage(null);
        } else {
          const messagesRef = collection(db, 'messages');
          await addDoc(messagesRef, {
            chatId,
            senderId: currentUserId,
            recipientId: user.id,
            content,
            type,
            timestamp: serverTimestamp(),
            edited: false,
          });
        }
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handlePressMessage = (message) => {
    if (!message) return;
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const handleDeleteMessage = async () => {
    try {
      const messageRef = doc(db, 'messages', selectedMessage.id);
      await deleteDoc(messageRef);
      setModalVisible(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    setModalVisible(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMessage(null);
  };

  const isSender = (message) => message.senderId === currentUserId;

  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <Image source={require('../assets/profile.png')} style={styles.userImage} />
        <Text style={styles.title}>{user.username}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => {
          const timestamp = item.timestamp ? item.timestamp.toDate() : new Date();

          return (
            <View
              style={[
                styles.messageContainer,
                isSender(item) ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              {item.type === 'text' ? (
                <Text style={styles.messageText}>
                  {item.content}{' '}
                  {item.edited && <Text style={styles.editedLabel}>(edited)</Text>}
                </Text>
              ) : item.type === 'image' ? (
                <Image source={{ uri: item.content }} style={styles.media} />
              ) : item.type === 'video' ? (
                <Video
                  source={{ uri: item.content }}
                  style={styles.media}
                  useNativeControls
                  resizeMode="contain"
                />
              ) : null}

              <Text style={styles.timestamp}>
                {timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
        onScrollBeginDrag={() => setUserScrolling(true)}
        onScrollEndDrag={() => setUserScrolling(false)}
        onContentSizeChange={() => {
          if (!userScrolling) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <Button
          title={editingMessage ? 'Update' : 'Send'}
          onPress={() => sendMessage(newMessage)}
        />
      </View>

      {uploading && <ActivityIndicator size="large" color="#0000ff" />}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Button
              title="Edit"
              onPress={() => selectedMessage && handleEditMessage(selectedMessage)}
            />
            <Button title="Delete" onPress={handleDeleteMessage} />
            <Button title="Cancel" onPress={handleCloseModal} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#cce7ff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e1e1e1',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  editedLabel: {
    fontSize: 12,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 10,
  },
});
