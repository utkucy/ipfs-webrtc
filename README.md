## A Video Chat App - Web3RTC

It has been observed that people with different needs (work, social, school, etc.) seek different solutions to meet the increasing need for online meetings. Web3RTC is a video chat application built on completely decentralized technologies. It aims to establish connections between users without the need for any central server to store data or transmit media resources.

Web3RTC uses peer connections for both storing and transmitting operations:

**Store Operations** <br />
Authentication processes (register - login), creating and retrieving room data (participant list, chat messages etc.), storing and retrieving past meetings information, storing past meeting records, allowing to make changes for user preferences.

**Transmitting Media Source Operations** <br />
Establishing connection between peers in the rooms with both voice (source: microphone) and video (source: camera, screen share) sources.

Web app can be found on the https://web3rtc.com/

## Table of Contents

1. Features
2. Requirements
3. Installation
4. Usage
5. Contributing
6. License

### Features

1. IPFS will be used for all data management process
2. Authentication process will be added as Login and Register cases with OrbitDB.
3. Ability to Create a room
4. Ability to Join a room
5. Ability to Chat with others in the room
6. Ability to Share voice and camera source
7. Ability to Change media sources
8. Ability to Add other users to the contact list
9. Ability to List Past Meetings
10. Ability to List Contact List
11. Ability to Manage App Settings, are common dashboard usages for all apps.
12. Upload recorded meeting to Web3Storage
13. Sing-in option with Metamask

### Requirements

* Node.js (version 14 or higher)
* NPM (version 6 or higher)

### Installation

1. Clone this repository
2. Install dependencies: `yarn install`

### Usage

1. Start the app: `yarn start`
2. Open your browser and navigate to http://localhost:3000
3. Register an account and login with the registered account
4. Create a Room or Join a Room
5. Start communicating with others instantly!

## Contributing

Contributions are welcome and appreciated. To contribute, please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch`
3. Make your changes and commit them: `this commit -m "Add new feature"`
4. Push to the branch `git push origin feature-branch`
5. Create a pull request

## License

This project is licensed under the GNU General Public License v3.0 License. See the LICENSE file for more details.
