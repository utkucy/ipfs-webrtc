import React from "react";
import "./App.css";
import { BrowserRouter, Route, Switch, HashRouter } from "react-router-dom";
import { observer } from "mobx-react";
import { action, observable, computed, toJS, reaction } from "mobx";

import LoginScreen from "./screens/login/main";
import RegisterScreen from "./screens/register/main";
import ForgotPasswordScreen from "./screens/forgotPassword/main";
import DashboardScreen from "./screens/dashboard/index";
import MeetingRecordsScreen from "./screens/dashboard/meeting_records";
import Room from "./screens/room/main";
import { Spin } from "antd";

import { User } from "./models/user";
import { create } from "ipfs";
import { store } from "store";
import styled from "styled-components";

@observer
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
    await this.connect();
  }

  async componentWillUnmount() {
    // await store.databaseStore.odb.disconnect();
  }

  @action.bound
  async connect() {
    try {
      await store.databaseStore.connect();
    } catch (error) {
      console.log("create ipfs", error);
    }
  }

  render() {
    if (!store.databaseStore.isOnline) {
      return (
        <SpinnerContainer>
          <Spin tip="Loading..." size="large" />
        </SpinnerContainer>
      );
    }

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

const SpinnerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default App;
