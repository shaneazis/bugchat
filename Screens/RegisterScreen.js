import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../Services/FirebaseAuth'; // Ensure the path is correct

export default function Register({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if the phone number is already registered in Firestore
  const checkPhoneNumberExistence = async (phone) => {
    try {
      // Query Firestore for a document where phone number matches
      const q = query(collection(db, 'phone_numbers'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('This phone number is already registered.');
        return true; // Phone number is already registered
      }
      return false; // Phone number is not registered
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false; // Assume it's not registered if an error occurs
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
  
    // Validate input fields
    if (!email || !password || !username || !phone) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
  
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
  
    // Check if the phone number is already registered
    const isPhoneRegistered = await checkPhoneNumberExistence(phone);
    if (isPhoneRegistered) {
      setIsLoading(false);
      return; // Stop registration if phone number is already registered
    }
  
    try {
      // Register user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save user details to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        username,
        phone,
        password, // Include password here
        createdAt: new Date().toISOString(),
      });
  
      // Save the phone number to the phone_numbers collection to avoid future duplicates
      await setDoc(doc(db, 'phone_numbers', user.uid), {
        phone,
      });
  
      alert('Registration successful! Redirecting to home...');
      setIsLoading(false);
      navigation.navigate('home');
    } catch (error) {
      setIsLoading(false);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already associated with an account.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password must be at least 6 characters long.');
          break;
        default:
          setError(error.message);
      }
    }
  };
  const goToLogin = () => {
    navigation.navigate('login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
        style={styles.textInput}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        onChangeText={setUsername}
        placeholder="Username"
        value={username}
        style={styles.textInput}
        autoCapitalize="none"
      />
      <TextInput
        onChangeText={setPhone}
        placeholder="Phone Number"
        value={phone}
        style={styles.textInput}
        keyboardType="phone-pad"
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password"
        value={password}
        style={styles.textInput}
        secureTextEntry
      />
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <Button onPress={handleRegister} title="Register" />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Text onPress={goToLogin} style={styles.loginText}>
        Already have an account? Log in here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'gray',
    width: 200,
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  loginText: {
    marginVertical: 10,
  },
});
