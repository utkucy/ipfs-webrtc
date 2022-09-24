import React from "react";
import "./App.css";
import { BrowserRouter, Route, Switch, HashRouter } from "react-router-dom";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";

import LoginScreen from "./screens/login/main";
import RegisterScreen from "./screens/register/main";
import ForgotPasswordScreen from "./screens/forgotPassword/main";
import DashboardScreen from "./screens/dashboard/index";
import MeetingRecordsScreen from "./screens/dashboard/meeting_records";
import Room from "./screens/room/main";

import { User } from "./models/user";
import { create } from "ipfs";
import { store } from "store";

class App extends React.Component {
  @observable user;

  constructor(props) {
    super(props);
    // this.user
    this.changeUser = this.changeUser.bind(this);
  }

  @action.bound
  changeUser(user) {
    this.user = new User(user);
  }

  async componentDidMount() {
    const ipfs = await create({
      repo: "./ipfs-webrtc-repo",
      EXPERIMENTAL: { pubsub: true },
      preload: { enabled: false },
      config: {
        Addresses: {
          Swarm: [
            // Use IPFS  webrtc signal server
            "/dns6/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star",
            "/dns4/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star",
            // Use local signal server
            // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
          ],
        },
      },
    });
    await store.databaseStore.connect(ipfs);
  }

  render() {
    return (
      <HashRouter>
        <Switch>
          <Route
            path="/"
            exact
            render={(props) => (
              <LoginScreen
                {...props}
                user={this.user}
                changeUser={this.changeUser}
              />
            )}
          />
          <Route
            path="/register"
            render={(props) => (
              <RegisterScreen
                {...props}
                user={this.user}
                changeUser={this.changeUser}
              />
            )}
          />
          <Route
            path="/forgot_password"
            render={(props) => <ForgotPasswordScreen {...props} />}
          />
          <Route
            path="/dashboard"
            render={(props) => <DashboardScreen {...props} user={this.user} />}
          />
          <Route path="/room/:roomID/:password" component={Room} />
        </Switch>
      </HashRouter>
    );
  }
}

export default App;
