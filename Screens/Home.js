import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../Services/FirebaseAuth';

export default function Home({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({}); // Store unread message counts per user

  useEffect(() => {
    // Fetch users from Firestore
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        navigation.navigate('login');
      }
    });

    fetchUsers();
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Listen for unread messages for the current user
    if (currentUser) {
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', currentUser.uid),
        where('isRead', '==', false)
      );

      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const counts = {};

        snapshot.forEach((doc) => {
          const message = doc.data();
          counts[message.senderId] = (counts[message.senderId] || 0) + 1;
        });

        setUnreadCounts(counts);
      });

      return () => unsubscribeMessages();
    }
  }, [currentUser]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(text.toLowerCase()) ||
        (user.phone && user.phone.includes(text))
    );
    setFilteredUsers(filtered);
  };

  const navigateToChat = (user) => {
    navigation.navigate('chat', { user });
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('login');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username or phone number"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredUsers.length > 0 ? filteredUsers : users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigateToChat(item)}>
            <View style={styles.userContainer}>
              <Image
                source={require('../assets/profile.png')}
                style={styles.userImage}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userText}>{item.username}</Text>
                {unreadCounts[item.id] > 0 && (
                  <Text style={styles.unreadCount}>
                    {unreadCounts[item.id]} new message(s)
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      {currentUser && <Button onPress={handleLogout} title="Logout" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
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
  userInfo: {
    flex: 1,
  },
  userText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unreadCount: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
});
