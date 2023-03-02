import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled from "styled-components";
import { Button, Typography, Spin, Layout } from "antd";
import {
  VideoCameraOutlined,
  PlusSquareOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { v1 as uuid } from "uuid";
import generator from "generate-password";
import moment from "moment";
import { Cookies } from "react-cookie";

import JoinRoom from "../../components/screens/dashboard/join-room/joinRoom";
import { User } from "../../models/user";
import { store } from "store";
import { Room } from "models/room";
import { antLoaderIcon } from "App";

const { Text, Title } = Typography;
const { Header, Footer, Sider, Content } = Layout;

@observer
class DashboardScreen extends React.Component {
  @observable isModalVisible = false;
  @observable user;
  @observable time;
  @observable date;

  constructor(props) {
    super(props);

    this.changeModalVisibility = this.changeModalVisibility.bind(this);
  }

  @action.bound
  changeTimer = () => {
    this.time = moment().format("H:mm");
  };

  async componentDidMount() {
    setInterval(this.changeTimer, 1000);
    this.user = new User(this.props.user);
  }

  @action.bound
  changeModalVisibility() {
    this.isModalVisible = !this.isModalVisible;
  }

  @action.bound
  generateRoomID() {
    let charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 10; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
      if (i === 4) retVal += "-";
    }

    return retVal;
  }

  @action.bound
  async createMeeting() {
    const room_id = this.generateRoomID();
    const room_password = generator.generate({
      length: 10,
      numbers: true,
    });
    const room = new Room({
      room_id: room_id,
      room_password: room_password,
      host_id: this.user._id,
      host_displayName: this.user.displayName,
      createdAt: moment().format(),
      participant_list: [
        {
          uid: this.user._id,
          displayName: this.user.displayName,
          email: this.user.email,
          socketID: "",
        },
      ],
      current_participant_list: [
        {
          uid: this.user._id,
          displayName: this.user.displayName,
          email: this.user.email,
          socketID: "",
        },
      ],
    });
    try {
      const response = await store.userStore.createMeeting(room);
      if (this.user.settings.copy_invite_link) {
        navigator.clipboard.writeText(
          `Meeting ID: ${room_id}\n Password: ${room_password}`
        );
      }
      this.props.history.push(`/room/${room_id}/${room_password}`);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  render() {
    if (this.user === undefined || this.time === undefined) {
      return (
        <SpinnerContainer style={{ color: "rgb(109 40 217)" }}>
          <Spin
            style={{ color: "rgb(109 40 217)" }}
            tip="Loading..."
            size="large"
            indicator={antLoaderIcon}
          />
        </SpinnerContainer>
      );
    }
    return (
      <div className="flex h-full w-full flex-col px-10 mobile:p-5 ">
        <div className="w-full h-26 flex mt-36 mobile:flex-col mobile:mt-8">
          <div className="w-full flex items-center">
            <Text
              style={{
                fontFamily: "Montserrat",
              }}
              ellipsis={{ tooltip: this.user.displayName }}
              className="text-purple-900 text-3xl mobile:text-4xl mobile:font-bold "
            >
              Hi, {this.user.displayName}!
            </Text>
            {/* <Text type="secondary">Meeting Notes</Text> */}
          </div>
          <div className="flex flex-col w-1/2 mobile:w-full mobile:mt-10 ">
            <Title
              style={{
                marginBottom: 0,
                // textAlign: "center",
              }}
              className="text-purple-900 text-6xl mobile:text-2xl mobile:relative mobile:-left-0.5 "
            >
              {this.time}
            </Title>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Montserrat",
              }}
              className="text-purple-900"
            >
              {moment().format("dddd, D MMMM")}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-16 mt-20">
          <div className="flex flex-col items-center">
            <div
              className={
                "cursor-pointer w-24 h-24 rounded-lg shadow-md flex items-center justify-center bg-purple-600 hover:bg-purple-800 transition-all"
              }
              onClick={this.createMeeting}
            >
              <VideoCameraOutlined style={{ fontSize: 50, color: "white" }} />
            </div>
            <Text
              style={{
                marginTop: 10,
                fontFamily: "Montserrat",
              }}
              className="text-purple-900"
            >
              New Meeting
            </Text>
          </div>

          <div className="flex flex-col items-center ">
            <div
              className={
                "cursor-pointer w-24 h-24 rounded-lg shadow-md flex items-center justify-center bg-purple-600 hover:bg-purple-800 transition-all"
              }
              onClick={this.changeModalVisibility}
            >
              <PlusSquareOutlined style={{ fontSize: 50, color: "white" }} />
            </div>
            <Text
              style={{
                marginTop: 10,
                fontFamily: "Montserrat",
              }}
              className="text-purple-900"
            >
              Join
            </Text>
          </div>
        </div>

        <JoinRoom
          isModalVisible={this.isModalVisible}
          changeModalVisibility={this.changeModalVisibility}
          history={this.props.history}
          user={this.user}
        />
      </div>
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

export default DashboardScreen;
