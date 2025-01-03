import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword ,onAuthStateChanged} from 'firebase/auth';
import {auth} from '../Services/FirebaseAuth';
// Login.js



export default function Login({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const checkIfloggedIn=()=>{
    onAuthStateChanged(auth,(user)=>{
      if(user){
        navigation.navigate('home')
      }
    })

  }
  useEffect(() => {
    
    checkIfloggedIn()
  
   
      
  }, [])
  

  const handleLogin = () => {
    setError('');
    console.log('Email:', email);
    console.log('Password:', password);

    // Firebase login only takes email and password
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigation.navigate('home')
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const gotoregister=()=>{
   navigation.navigate('Register')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' ,paddingLeft: 60,}}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Login</Text>
      <TextInput
        onChangeText={setEmail}
        value={email}
        placeholder="Email"
        style={styles.textInput}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        onChangeText={setPassword}
        value={password}
        placeholder="Password"
        style={styles.textInput}
        secureTextEntry
      />
      <Button onPress={handleLogin} title="Login" />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Text onPress={gotoregister} style={{ marginVertical: 10 }}>Don't have an account? Register here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: 'gray',
    width: 200,
    marginVertical: 10,
    paddingHorizontal: 8,
  },
});
