const { GraphQLServer, PubSub } = require('graphql-yoga')
const { v4 } = require('uuid')

const messages = []
const typeDefs = `
  type Message {
    id: ID!,
    user: String!
    content: String!
  }

  type Query {
    messages: [Message]
  }

  type Mutation {
    postMessage(user: String!, content: String!): ID!
  }

  type Subscription {
    messages: [Message!]
  }
`

const subscribers = []
const onMessagesUpdates = (pub) => subscribers.push(pub)

const resolvers = {
  Query: {
    messages: () => messages
  },
  Mutation: {
    postMessage: (parent, { user, content }) => {
      const id = v4()
      messages.push({
        id,
        user,
        content
      })
      subscribers.forEach((pub) => pub())
      return id
    }
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = v4()
        onMessagesUpdates(() => pubsub.publish(channel, { messages }))
        setTimeout(() => pubsub.publish(channel, { messages }), 0)
        return pubsub.asyncIterator(channel)
      }
    }
  }

}

const pubsub = new PubSub()
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } })
server.start(({ port }) => {
  console.log(`🚀 🚀 🚀 launched -> http://localhost:${port}/`)
})
