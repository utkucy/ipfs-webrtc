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
// import backgroundImg from '../../assets/images/dashboard-img.png'
import backgroundImg from "../../assets/images/dashboard-try.png";
import { User } from "../../models/user";
import { store } from "store";
import { Room } from "models/room";

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
        <SpinnerContainer>
          <Spin tip="Loading..." size="large" />
        </SpinnerContainer>
      );
    }
    return (
      <RightContainer>
        <GreetingsContainer>
          <NameContainer>
            <Text
              style={{
                fontSize: 30,
                fontFamily: "Montserrat",
                color: "#043d75",
              }}
            >
              Hi, {this.user.displayName}!
            </Text>
            {/* <Text type="secondary">Meeting Notes</Text> */}
          </NameContainer>
          <DateContainer>
            <Title
              style={{
                fontSize: 64,
                marginBottom: 0,
                textAlign: "center",
                color: "#002766",
              }}
            >
              {this.time}
            </Title>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Montserrat",
                color: "#002766",
              }}
            >
              {moment().format("dddd, D MMMM")}
            </Text>
          </DateContainer>
        </GreetingsContainer>

        <MeetingOptions>
          <OptionContainer>
            <OptionCard onClick={this.createMeeting}>
              <VideoCameraOutlined style={{ fontSize: 50, color: "white" }} />
            </OptionCard>
            <Text
              style={{
                marginTop: 10,
                fontFamily: "Montserrat",
                color: "#002766",
              }}
            >
              New Meeting
            </Text>
          </OptionContainer>

          <OptionContainer>
            <OptionCard onClick={this.changeModalVisibility}>
              <PlusSquareOutlined style={{ fontSize: 50, color: "white" }} />
            </OptionCard>
            <Text
              style={{
                marginTop: 10,
                fontFamily: "Montserrat",
                color: "#002766",
              }}
            >
              Join
            </Text>
          </OptionContainer>

          {/* <OptionContainer>
            <OptionCard >
              <MessageOutlined style={{ fontSize: 50, color: 'white' }} />
            </OptionCard>
            <Text style={{ marginTop: 10, fontFamily: 'Montserrat', color: "#002766" }}>Saved Messages</Text>
          </OptionContainer> */}
        </MeetingOptions>

        <BackgroundContainer>
          {/* <img style={{ width: 600, height: 300 }} src={backgroundImg} alt="backgrond-image"/> */}
        </BackgroundContainer>

        <JoinRoom
          isModalVisible={this.isModalVisible}
          changeModalVisibility={this.changeModalVisibility}
          history={this.props.history}
          user={this.user}
        />
      </RightContainer>
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

const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1 1 auto;
  /* background-color:yellow; */
  /* align-items: center; */
  padding-left: 60px;
  padding-right: 60px;
`;

const GreetingsContainer = styled.div`
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 140px;
`;

const NameContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
`;

const DateContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  align-items: flex-end;
  justify-content: center;
`;

const MeetingOptions = styled.div`
  width: 40%;
  height: 150px;
  display: flex;
  margin-top: 70px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const OptionContainer = styled.div`
  /* width: 300px; */
  /* height: 110px; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const OptionCard = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 30px;
  box-shadow: 0px 12px 24px rgba(132, 153, 193, 0.08);
  /* margin-right: 180px; */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #bae7ff;
  transition: 0.3s;

  &:hover {
    cursor: pointer;
    background-color: #1890ff;
    transform: translateY(-10px);
  }
`;

const BackgroundContainer = styled.div`
  width: 100%;
  height: 460px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  background-repeat: no-repeat, no-repeat;
  background-size: 100% 100%;
  background-position: left top, right top;
`;

export default DashboardScreen;
