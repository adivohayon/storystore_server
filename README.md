# storystore

## Local setup

Add the following into "payment" field:

```
{
	"test": true,
	"token": "08d7c3d5-fb0b-486e-8705-2ec2cd3479ca"
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
