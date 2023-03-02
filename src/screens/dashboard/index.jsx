import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled, { css } from "styled-components";
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
import { antLoaderIcon } from "App";

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

  @computed
  get menuItems() {
    const isMobile = store.isMobile;
    return [
      {
        icon: (
          <HomeOutlined
            style={{
              height: 24,
              fontSize: 24,
            }}
          />
        ),
        title: "Home",
      },
      {
        icon: (
          <ClockCircleOutlined
            style={{
              height: 24,
              fontSize: 24,
            }}
          />
        ),
        title: "Meetings",
      },
      {
        icon: (
          <ContactsOutlined
            style={{
              height: 24,
              fontSize: 24,
            }}
          />
        ),
        title: "Contacts",
      },
      {
        icon: (
          <SettingOutlined
            style={{
              height: 24,
              fontSize: 24,
            }}
          />
        ),
        title: "Settings",
      },
      {
        icon: <LogoutOutlined style={{ height: 24, fontSize: 24 }} />,
        title: "Logout",
        onClick: this.logout,
      },
    ];
  }

  render() {
    if (this.user === undefined) {
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
      <div className="w-screen max-w-screen min-w-screen h-screen min-h-screen max-h-screen flex mobile:flex-col-reverse mobile:justify-between">
        <div
          className="w-64 h-full flex flex-col justify-center px-5 bg-purple-700 overflow-hidden
          mobile:w-full mobile:h-20 mobile:min-h-20 mobile:flex-row mobile:flex-wrap
          mobile:py-4 mobile:justify-center mobile:items-center mobile:gap-2 mobile:absolute mobile:bottom-0"
        >
          {!store.isMobile && (
            <LogoContainer>
              {/* <img style={{ marginTop: 32 }} src={logo} alt="Logo" /> */}
              <Title
                level={2}
                style={{
                  fontFamily: "Montserrat",
                  textAlign: "center",
                  marginBottom: 0,
                }}
                className="text-purple-50"
              >
                Web3RTC
              </Title>
            </LogoContainer>
          )}
          {this.menuItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 cursor-pointer 
            px-3 py-2 mb-20 rounded transition-all
             hover:text-purple-900 hover:bg-purple-200 ${
               this.selectedIndex === index
                 ? "text-purple-900 bg-purple-200"
                 : "text-purple-100"
             } 
            mobile:mb-0 
             `}
              onClick={() =>
                item.onClick ? item.onClick : this.changeSelectedIndex(index)
              }
            >
              {item.icon}
              {!store.isMobile && (
                <div
                  className={` items-center h-full font-custom font-bold text-base flex  relative top-0.5`}
                >
                  {item.title}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="w-full h-full mobile:hMobileContent flex bg-purple-50 ">
          {this.selectedScreen}
        </div>
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

const LogoContainer = styled.div`
  position: absolute;
  top: 24px;
  display: flex;
  flex: 0 0 100px;
  justify-content: center;
  align-items: center;
`;

export default DashboardScreen;
