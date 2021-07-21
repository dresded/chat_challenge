import React, { useRef, useEffect, useState } from 'react'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useSubscription,
  useMutation,
  gql
} from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'

const link = new WebSocketLink({
  uri: 'ws://localhost:4000/',
  options: {
    reconnect: true
  }
})
const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
  link
})

const getMessages = gql`
  subscription {
  messages {
    id
    content
    user
  }
}
`

const postMessages = gql`
  mutation ($user: String!, $content:String!) {
    postMessage(user: $user, content: $content)
  }
`

const Messages = ({ user }) => {
  const { data } = useSubscription(getMessages)
  if (!data) {
    return null
  }

  return (
    <>
      {data.messages.map(({ id, user: messageUser, content }) => (
        <div key={id}>
          <div
            style={Object.assign({}, styles.messageAuthor, { textAlign: user === messageUser ? 'right' : 'left' })}
          >
            {messageUser}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: user === messageUser ? 'flex-end' : 'flex-start',
              paddingBottom: '1em'
            }}
          >
            <div
              style={Object.assign({}, styles.messageContent, (user === messageUser) ? styles.transmitter : styles.receiver)}
            >
              {content}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

const Chat = (data) => {
  const [state, stateSet] = useState({
    user: data.user,
    content: ''
  })

  const [pstMessages] = useMutation(postMessages)
  const sendMessage = () => {
    if (state.content.trim().length > 0) {
      pstMessages({
        variables: state
      })
    }
    stateSet({
      ...state,
      content: ''
    })
  }

  const divRef = useRef(null)
  useEffect(() => {
    divRef.current.scrollIntoView({ behavior: 'smooth' })
  })

  return (
    <div>
      <div style={{ paddingBottom: '55px' }}>
        <Messages user={state.user} />
      </div>
      <div ref={divRef} />
      <div
        class='columns is-flex' style={styles.bottomContainer}
      >
        <div class='column is-10'>
          <input
            class='input is-info'
            type='text'
            placeholder='Mensaje'
            value={state.content}
            onChange={(evt) => stateSet({
              user: data.user,
              content: evt.target.value
            })}
            onKeyUp={(evt) => {
              if (evt.keyCode === 13) {
                sendMessage()
              }
            }}
          />
        </div>
        <div class='column is-2'>
          <button
            class='button is-link is-light'
            onClick={() => sendMessage()}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

const UserForm = (props) => {
  return (
    <div>
      <div class='field'>
        <label class='label '>Username</label>
        <div class='field'>
          <div class='control'>
            <input
              class='input is-success'
              type='text'
              placeholder='Username'
              onKeyUp={props.onChange}
            />
          </div>
          <br />
          <div class='control'>
            <button class='button is-link' onClick={props.onClick}>Entrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Provider = () => {
  const [newUser, setNewUser] = useState('')
  const [user, setUser] = useState('')

  const handleNewUser = (evt) => {
    if (evt.target.value.trim().length > 0) {
      setNewUser(evt.target.value)
    }
  }

  const handleSetUser = () => {
    setUser(newUser)
  }
  return (
    <ApolloProvider client={client}>
      <div class='features'>
        <div class='container'>
          <div class='columns is-centered is-vcentered is-mobile'>
            <div
              class='column is-narrow has-text-centered'
              style={{ width: '80%' }}
            >
              {user
                ? <Chat user={user} />
                : <UserForm onClick={handleSetUser} onChange={handleNewUser} />}
            </div>
          </div>
        </div>
      </div>
    </ApolloProvider>
  )
}

const styles = {
  messageAuthor: {
    fontSize: '1.5em',
    paddingTop: 5,
    color: '#7184a3',
    textTransform: 'capitalize'
  },

  messageContent: {
    padding: '8px 25px',
    borderRadius: '10px',
    maxWidth: '80%',
    textAlign: 'left'
  },

  transmitter: {
    background: '#396ec4',
    color: 'white'
  },

  receiver: {
    background: '#919fb5',
    color: 'white'
  },

  bottomContainer: {
    marginTop: '1rem',
    padding: '1rem',
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'white'
  }
}

export default Provider
