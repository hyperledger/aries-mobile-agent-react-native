# Aries Hooks

This package exposes useful hooks that allow you to easily interact with AFJ.

Everything exported from Aries Hooks:

```
import
	AgentProvider, {
	useAgent,
	useConnections,
	useConnectionById,
	useConnectionByState,
	useCredentials,
	useCredentialById,
	useCredentialByState,
	useProofs,
	useProofById,
	useProofByState
} from 'aries-hooks'
```

First step is to wrap your entire app in our `<AgentProvider/>`. The provider takes two props, the first is your `agentConfig` object and the second is your `genesisUrl`. The base of your app should look something like this:

```
import AgentProvider from "aries-hooks"

const App = () => {
	return (
		<AgentProvider agentConfig={Your full agent config object} genesisUrl={Your genesis url} >
			// Your app here
		</AgentProvider>
	)
}
```

And that's it! Your app should be set up to recieve all the necessary data your app will need! Now let's see how we actually get that data to our components.

The `useAgent` hook returns `{ agent, loading }` so anytime you need access to any of the methods tied to the agent, you can `useAgent()` anywhere.

The following is an example of how you could use the `useConnections` hook to render a full list of all a user's connections.

```
import { useConnections } from 'aries-hooks'

const MyConnectionsComponent = () => {
	// all base hooks return an array of objects and a loading boolean
	const { connections, loading } = useConnections()

	return (
		<Flatlist
			data={connections}
			renderItem={({item}) => <MyListItem connection={item} />}
		/>
	)
}
```

The three base hooks: `useConnections`, `useCredentials`, and `useProofs` work just like the above! Just call the hook, destructure the data, and pass it through!

Each base hook has a `ById` version that returns a singular record. For example if I wanted only a specific connectionRecord, I'd do this.
`const { connection } = useConnection(id)`

More commonly, you'll want to get a filtered list of records based off of their state. Well, Hooray! We have a `ByState` version as well. For example, you can do this:
`const credentials = useCredentialByState(CredentialState.OfferReceived)`

Boom Bam Baby!
That's all you need to know to get that data flowinggg.
