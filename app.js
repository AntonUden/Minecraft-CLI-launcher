const { Client, Authenticator } = require('minecraft-launcher-core');
const fs = require('fs');

var auth = null;

const launcher = new Client();
const prompt = require('prompt');

launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));

prompt.start();

// check if the auth file exists
if (fs.existsSync("./auth.json")) {
	// read the auth file
	auth = JSON.parse(fs.readFileSync("./auth.json"));

	//console.log(auth);

	// lets check if the token is valid
	Authenticator.validate(auth.access_token, auth.client_token).then((data) => {
		// token it valid, lets show the menu
		console.log("Token validated")
		showMenu();
	}).catch((err) => {
		// Could not get refresh to work so lets just require the user to login again
		askForLogin();
		/*
		console.log("Failed to validate token. Trying to refresh it");
		
		Authenticator.refreshAuth(auth.access_token, auth.client_token, auth.selected_profile).then((data) => {
			console.log(data);
			console.log("Token refreshed");
		}).catch((err) => {
			console.log(err);
			console.log("Could not refresh token. Plese login again");
			askForLogin();
		});*/
	})
} else {
	// No auth.json found. ask the user for login
	console.log("Please login");
	askForLogin();
}

function askForLogin() {
	// Login and then show the menu
	login().then((data) => {
		if (data) {
			showMenu();
		} else {
			console.log("Invalid login. Please try again");
			askForLogin();
		}
	});
}

function showMenu() {
	// clear some lines
	console.log("\n\n\n\n\n");

	// Show menu
	console.log("Welcome " + auth.name + " to Zeeraa's trashy cli launcher")
	console.log("Select an option");
	console.log("1: launch");
	console.log("2: logout");
	const properties = [
		{
			name: 'option'
		}
	];

	prompt.get(properties, function (err, result) {
		if (err) {
			console.log(err);
		}

		// Launch the game
		if (result.option == 1) {
			let opts = {
				clientPackage: null,
				authorization: auth,
				root: "./minecraft",
				version: {
					number: "1.16.5",
					type: "release"
				},
				memory: {
					max: "4G",
					min: "4G"
				}
			}

			launcher.launch(opts);
		} else if (result.option == 2) {
			// invalidate the token and remove the auth file
			Authenticator.invalidate(auth.access_token, auth.client_token);
			fs.unlinkSync("./auth.json");
		} else {
			// The user is too stupid to select either 1 or 2
			showMenu();
		}
	});
}

function login() {
	return new Promise(resolve => {
		const properties = [
			{
				name: 'email'
			},
			{
				name: 'password',
				hidden: true
			}
		];

		prompt.get(properties, function (err, result) {
			if (err) {
				console.log(err);
			}

			console.log("Trying to login with email: " + result.email);

			Authenticator.getAuth(result.email, result.password).then((data) => {
				// Store the auth data
				auth = data;
				fs.writeFileSync("./auth.json", JSON.stringify(auth, null, 4));
				console.log("logged in as " + data.name + " (" + data.uuid + ")");
				resolve(true);
			}).catch((err) => {
				//console.error(err);
				resolve(false);
			});
		});
	});
}