# storystore

## Local setup

Add the following into "payment" field:

```
{
	"test": true, 
	"token": "f7658748-12a7-4fcd-90dd-95428eadb2fe"
}
```

## Testing locally

```
ssh -R 80:localhost:4000 serveo.net
```

This will result with a url:

```
Forwarding HTTP traffic from https://forsit.serveo.net
```

Add the hostname to your `.env` file:

```
SERVEO=forsit.serveo.net
```
