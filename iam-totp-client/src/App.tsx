import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import jwt_decode from "jwt-decode"
import './App.css';

const HOST = 'http://localhost:4000'

function App() {
  const [page, setPage] = useState('login')
  const [qrcode, setQrcode] = useState('')
  const [me, setMe] = useState<any>(null)

  const loginUsername = useRef<HTMLInputElement>(null)
  const loginPassword = useRef<HTMLInputElement>(null)
  const registerUsername = useRef<HTMLInputElement>(null)
  const registerPassword = useRef<HTMLInputElement>(null)
  const code = useRef<HTMLInputElement>(null)

  useEffect(() => {
    verifyToken()
  })

  const verifyToken = () => {
    const token = localStorage.getItem('token')
    if(token) {
      try {
        const decodedToken: any = jwt_decode(token);
        
        if(new Date().getTime() / 1000 > decodedToken.exp) {
          localStorage.clear()
          return setPage('login')
        }

        if ( decodedToken.bIsTOTPRequired === true ) {
          return setPage('verify')
        } else {
          return setPage('logged')
        }
      } catch ( err ) {
        return setPage('login')
      }
    }
    setPage('login')
  }
  const login = async () => {
    try {
      const { data } = await axios.post(`${HOST}/auth/login`, {username: loginUsername.current && loginUsername.current.value, password: loginPassword.current && loginPassword.current.value})
      localStorage.setItem('token', data)
      verifyToken()
    } catch(err) {

    }
  }
  const register = async () => {
    try {
      const { data } = await axios.post(`${HOST}/auth/register`, {username: registerUsername.current && registerUsername.current.value, password: registerPassword.current && registerPassword.current.value})
      setQrcode(data.qr_code)
      setPage('post_register')
    }catch(err) {

    }
  }
  const verify = async () => {
    try {
      const { data } = await axios.post(`${HOST}/auth/verify`, {code: code.current && code.current.value}, {
        headers: {
          authorization: localStorage.getItem('token') || ''
        }
      })
      localStorage.setItem('token', data)
      verifyToken()
    }catch(err) {
      setPage('login')
    }
  }
  const logout = () => {
    localStorage.clear()
    setPage('login')
    setMe(null)
  }

  const getMe = async () => {
    try {
      const { data } = await axios.get(`${HOST}/user/me`, {
        headers: {
          authorization: localStorage.getItem('token') || ''
        }
      })
      setMe(data)
    }catch(err) {

    }
  }

  return (
    <div className="App">
      {page === 'login' ? 
      <header className="App-header">
        <input ref={loginUsername} type="text"></input>
        <input ref={loginPassword} type="password"></input>
        <button onClick={() => login()}>Login</button>
        <button onClick={() => setPage('register')}>Create an account</button>
      </header> : <></>}
      {page === 'register' ? 
      <header className="App-header">
        <input ref={registerUsername} type="text"></input>
        <input ref={registerPassword} type="password"></input>
        <button onClick={() => register()}>Register</button>
        <button onClick={() => setPage('login')}>Already have an account</button>
      </header> : <></>}
      {page === 'post_register' ? 
      <header className="App-header">
        <img src={qrcode} alt="qrcode"></img>
        <button onClick={() => setPage('login')}>QR Code is saved</button>
      </header> : <></>}
      {page === 'verify' ? 
      <header className="App-header">
        <input type="text" ref={code} placeholder="Code from Authenticator"></input>
        <button onClick={() => verify()}>Verify</button>
      </header> : <></>}
      {page === 'logged' ? 
      <header className="App-header">
        {me ? <div>{me.username}</div> : <></>}
        <button onClick={() => getMe()}>Get Me</button>
        <button onClick={() => logout()}>Logout</button>
      </header> : <></>}
    </div>
  );
}

export default App;
