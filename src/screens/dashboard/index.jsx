import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled from "styled-components";
import {
  Button,
  Typography,
  Spin,
  Layout,
  Result,
  message,
  notification,
} from "antd";
import {
  HomeOutlined,
  ClockCircleOutlined,
  ContactsOutlined,
  SettingOutlined,
  LogoutOutlined,
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

import MainScreen from "./main";
import MeetingRecordsScreen from "./meeting_records";
import ContactsScreen from "./contacts";
import SettingsScreen from "./settings";

import { store } from "store";
import { Settings } from "models/settings";

const { Text, Title } = Typography;
const { Header, Footer, Sider, Content } = Layout;

@observer
class DashboardScreen extends React.Component {
  @observable selectedIndex = 0;
  @observable hoverIndex = 0;
  @observable user = undefined;

  @observable videoDevices = [];
  @observable microphoneDevices = [];
  @observable speakerDevices = [];

  constructor(props) {
    super(props);
    this.updateSettings = this.updateSettings.bind(this);
    // this.logout();
  }

  async componentDidMount() {
    const cookies = new Cookies();
    await this.enumareteDevices();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async () => {
        const id = cookies.get("_id");
        if (id) {
          cookies.remove("displayName");
          cookies.remove("_id");
          cookies.remove("rememberMe");
          if (this.user.email === "Wallet User")
            cookies.set("accountChanged", true);
        }

        if (this.user.email === "Wallet User") {
          window.ethereum
            .request({ method: "eth_requestAccounts" })
            .then(async (addressArray) => {
              // Return the address of the wallet
              const address = addressArray[0];

              let user = await store.userStore.getUser(address);
              if (!user) {
                const _user = new User({
                  _id: address,
                  displayName: `Wallet User: ${address}`,
                  email: "Wallet User",
                  password: address,
                  settings: new Settings({
                    confirm_leave_meeting: true,
                    copy_invite_link: true,
                    show_meeting_duration: true,
                    turn_of_media_devices: true,
                  }),
                });

                try {
                  const hash = await store.userStore.register(_user);
                  if (!hash)
                    return notification.error({
                      message: `Notification`,
                      description: "Register failed",
                      placement: "topRight",
                      duration: 2.5,
                      style: { borderRadius: 8 },
                    });
                  user = _user;
                } catch (error) {
                  console.error("Error adding document: ", error);
                }

                notification.success({
                  message: `Notification`,
                  description: "Succesfully registered",
                  placement: "topRight",
                  duration: 2.5,
                  style: { borderRadius: 8 },
                });
              }

              cookies.set("_id", address);
              this.props.history.push("/");
            });
        }
      });
    }

    try {
      const user = await store.userStore.getUser(cookies.get("_id"));

      if (user) {
        this.user = new User(user);
      } else {
        this.logout();
        return message.error(
          "Something went wrong! Please try to login again."
        );
      }
    } catch (error) {
      console.error("Error adding user document: ", error);
    }
  }

  @action.bound
  logout() {
    const cookies = new Cookies();
    cookies.remove("displayName");
    cookies.remove("_id");
    cookies.remove("rememberMe");
    this.props.history.push("/");
  }

  @action.bound
  changeSelectedIndex(index) {
    this.selectedIndex = index;
  }

  @action.bound
  changeHoveredIndex(index) {
    this.hoverIndex = index;
  }

  @action.bound
  updateSettings(settings) {
    this.user.settings = settings;
  }

  @action.bound
  async enumareteDevices() {
    this.microphoneDevices = [];
    this.videoDevices = [];
    this.speakerDevices = [];

    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    mediaDevices.forEach((md) => {
      if (md.kind === "audioinput") this.microphoneDevices.push(md);
      else if (md.kind === "videoinput") this.videoDevices.push(md);
      else if (md.kind === "audiooutput") this.speakerDevices.push(md);
    });
  }

  @computed
  get selectedScreen() {
    if (this.selectedIndex === 1)
      return <MeetingRecordsScreen user={this.user} />;
    else if (this.selectedIndex === 2)
      return <ContactsScreen user={this.user} />;
    else if (this.selectedIndex === 3)
      return (
        <SettingsScreen user={this.user} updateSettings={this.updateSettings} />
      );

    return <MainScreen user={this.user} history={this.props.history} />;
  }

  render() {
    if (this.user === undefined) {
      return (
        <SpinnerContainer>
          <Spin tip="Loading..." size="large" />
        </SpinnerContainer>
      );
    }
    if (!this.videoDevices.length) {
      return (
        <SpinnerContainer>
          <Result
            status="500"
            title="Camera source is not found"
            subTitle="You need to have a camera connection to use application"
            extra={
              <Button type="primary" onClick={this.logout}>
                Logout
              </Button>
            }
          />
        </SpinnerContainer>
      );
    }
    return (
      <Layout style={{ height: "100%" }}>
        <Sider theme="light">
          <LeftContainer>
            <LogoContainer>
              {/* <img style={{ marginTop: 32 }} src={logo} alt="Logo" /> */}
              <Title
                level={2}
                style={{
                  fontFamily: "Montserrat",
                  textAlign: "center",
                  marginBottom: 0,
                  color: "#002766",
                }}
              >
                Web3RTC
              </Title>
            </LogoContainer>
            <LeftOptionContainer>
              <StyledButton
                type="link"
                shape="circle"
                style={{ borderWidth: 0, padding: 0, marginBottom: 70 }}
                icon={
                  <HomeOutlined
                    style={{
                      height: 32,
                      fontSize: 32,
                      color: this.selectedIndex === 0 ? "white" : "#bae7ff",
                    }}
                  />
                }
                size={32}
                ghost
                onMouseEnter={() => this.changeHoveredIndex(1)}
                onMouseLeave={() => this.changeHoveredIndex(0)}
                onClick={() => this.changeSelectedIndex(0)}
              >
                {this.hoverIndex === 1 && (
                  <Text
                    style={{
                      transition: 0.3,
                      fontSize: 16,
                      fontWeight: 600,
                      color: this.selectedIndex === 0 ? "white" : "#bae7ff",
                    }}
                  >
                    Home
                  </Text>
                )}
              </StyledButton>
              <StyledButton
                type="link"
                shape="circle"
                style={{ borderWidth: 0, padding: 0, marginBottom: 70 }}
                icon={
                  <ClockCircleOutlined
                    style={{
                      height: 32,
                      fontSize: 32,
                      color: this.selectedIndex === 1 ? "white" : "#bae7ff",
                    }}
                  />
                }
                size={32}
                ghost
                onMouseEnter={() => this.changeHoveredIndex(2)}
                onMouseLeave={() => this.changeHoveredIndex(0)}
                onClick={() => this.changeSelectedIndex(1)}
              >
                {this.hoverIndex === 2 && (
                  <Text
                    style={{
                      transition: 0.3,
                      fontSize: 16,
                      fontWeight: 600,
                      color: this.selectedIndex === 1 ? "white" : "#bae7ff",
                    }}
                  >
                    Past Meetings
                  </Text>
                )}
              </StyledButton>
              <StyledButton
                type="link"
                shape="circle"
                style={{ borderWidth: 0, padding: 0, marginBottom: 70 }}
                icon={
                  <ContactsOutlined
                    style={{
                      height: 32,
                      fontSize: 32,
                      color: this.selectedIndex === 2 ? "white" : "#bae7ff",
                    }}
                  />
                }
                size={32}
                ghost
                onMouseEnter={() => this.changeHoveredIndex(3)}
                onMouseLeave={() => this.changeHoveredIndex(0)}
                onClick={() => this.changeSelectedIndex(2)}
              >
                {this.hoverIndex === 3 && (
                  <Text
                    style={{
                      transition: 0.3,
                      fontSize: 16,
                      fontWeight: 600,
                      color: this.selectedIndex === 2 ? "white" : "#bae7ff",
                    }}
                  >
                    Contacts
                  </Text>
                )}
              </StyledButton>
              <StyledButton
                type="link"
                shape="circle"
                style={{ borderWidth: 0, padding: 0, marginBottom: 70 }}
                icon={
                  <SettingOutlined
                    style={{
                      height: 32,
                      fontSize: 32,
                      color: this.selectedIndex === 3 ? "white" : "#bae7ff",
                    }}
                  />
                }
                size={32}
                ghost
                onMouseEnter={() => this.changeHoveredIndex(4)}
                onMouseLeave={() => this.changeHoveredIndex(0)}
                onClick={() => this.changeSelectedIndex(3)}
              >
                {this.hoverIndex === 4 && (
                  <Text
                    style={{
                      transition: 0.3,
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: 16,
                      color: this.selectedIndex === 3 ? "white" : "#bae7ff",
                    }}
                  >
                    Settings
                  </Text>
                )}
              </StyledButton>
              <StyledButton
                type="link"
                shape="circle"
                style={{ borderWidth: 0, padding: 0 }}
                icon={
                  <LogoutOutlined
                    style={{ height: 32, fontSize: 32, color: "#bae7ff" }}
                  />
                }
                size={32}
                ghost
                onMouseEnter={() => this.changeHoveredIndex(5)}
                onMouseLeave={() => this.changeHoveredIndex(0)}
                onClick={this.logout}
                // style={{ width: 200, height: 30 }}
              >
                {this.hoverIndex === 5 && (
                  <Text
                    style={{ fontSize: 16, fontWeight: 600, color: "#bae7ff" }}
                  >
                    Logout
                  </Text>
                )}
              </StyledButton>
            </LeftOptionContainer>
          </LeftContainer>
        </Sider>
        <Layout>
          <Content
            style={{
              overflow: "auto",
              height: "100%",
              backgroundColor: "rgb(246, 248, 252)",
            }}
          >
            {this.selectedScreen}
          </Content>
        </Layout>
      </Layout>
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

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  /* box-shadow: 0px 12px 24px rgba(132, 153, 193, 0.08); */
  overflow-x: hidden;
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  flex: 0 0 200px;
  /* background-color: red; */
`;

const LogoContainer = styled.div`
  display: flex;
  flex: 0 0 100px;
  justify-content: center;
  align-items: center;
  background-color: #003a8c;
`;
const LeftOptionContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  /* border-top-right-radius: 50px; */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #1890ff; /* fallback for old browsers */
  background: -webkit-linear-gradient(
    to bottom,
    #003a8c,
    #1890ff
  ); /* Chrome 10-25, Safari 5.1-6 */
  background: linear-gradient(
    to bottom,
    #003a8c,
    #1890ff
  ); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */

  /* background: #ad5389;  
  background: -webkit-linear-gradient(to bottom, #3c1053, #ad5389);  
  background: linear-gradient(to bottom, #3c1053, #ad5389);  */
`;

const StyledButton = styled(Button)`
  transition: 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    transform: translateX(-10px);
  }
`;

export default DashboardScreen;
