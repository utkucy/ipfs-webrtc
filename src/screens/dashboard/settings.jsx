import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled from "styled-components";
import {
  Button,
  Typography,
  Spin,
  Divider,
  Row,
  Col,
  Select,
  Tooltip,
  message,
  notification,
} from "antd";
import {
  VideoCameraOutlined,
  AudioOutlined,
  SoundOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import Video from "../../components/screens/room/video";

import { User } from "../../models/user";
import { Settings } from "../../models/settings";
import { store } from "store";
import { StyledCheckbox } from "screens/login/main";
import { antLoaderIcon } from "App";

const { Option } = Select;
const { Text, Title } = Typography;

@observer
class SettingsScreen extends React.Component {
  @observable emailAddress;
  @observable settings;
  @observable firestore_settings;
  @observable localStream = null;

  @observable videoDevices = [];
  @observable microphoneDevices = [];
  @observable speakerDevices = [];

  @observable is_fetch_complete = false;

  async componentDidMount() {
    await this.getLocalStream();
    // console.log(this.props.user);
    // console.log(this.settings);
    this.fetchSettings();
    this.is_fetch_complete = true;
  }

  componentWillUnmount() {
    if (this.localStream)
      this.localStream.getTracks().forEach((track) => track.stop());
  }

  @action.bound
  async fetchSettings() {
    try {
      const user = this.props.user;
      if (user) {
        this.firestore_settings = new Settings(user.settings);
        this.settings = new Settings(user.settings);
      }
    } catch (error) {
      console.log("Settings can not be read from firestore", error);
    }
  }

  @action.bound
  onConfirmLeaveMeetingChange(e) {
    this.settings.confirm_leave_meeting = e.target.checked;
  }

  @action.bound
  onCopyInviteLinkChange(e) {
    this.settings.copy_invite_link = e.target.checked;
  }

  @action.bound
  onShowMeetingDurationChange(e) {
    this.settings.show_meeting_duration = e.target.checked;
  }

  @action.bound
  onTurnOffMediaDevicesChange(e) {
    this.settings.turn_of_media_devices = e.target.checked;
  }

  @action.bound
  async getLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
        options: { mirror: true },
      });
      window.localStream = stream;
      this.localStream = stream;
      //stream.getTracks().forEach(track => console.log(track))
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      mediaDevices.forEach((md) => {
        // console.log(md)
        if (md.kind === "audioinput") this.microphoneDevices.push(md);
        else if (md.kind === "videoinput") this.videoDevices.push(md);
        else if (md.kind === "audiooutput") this.speakerDevices.push(md);
      });
    } catch (error) {
      console.log(error);
    }
  }

  @action.bound
  async dropDownClick(type) {
    this.microphoneDevices = [];
    this.videoDevices = [];
    this.speakerDevices = [];

    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    mediaDevices.forEach((md) => {
      if (type === "mic" && md.kind === "audioinput")
        this.microphoneDevices.push(md);
      else if (type === "video" && md.kind === "videoinput")
        this.videoDevices.push(md);
      else if (type === "speaker" && md.kind === "audiooutput")
        this.speakerDevices.push(md);
    });
  }

  @action.bound
  handleCameraChange(value) {
    this.videoDevices.find((vd) => {
      if (value === vd.label) {
        //selected video source değişimi
      }
    });
  }

  @action.bound
  handleMicrophoneChange(value) {
    this.microphoneDevices.find((md) => {
      if (value === md.label) {
        //selected mic source değişimi
      }
    });
    //console.log(value);
  }

  @action.bound
  handleSpeakerChange(value) {
    this.speakerDevices.find((sd) => {
      if (value === sd.label) {
        //selected speaker source değişimi
      }
    });
  }

  // TODO ADD RECORD PATH
  @action.bound
  async updateSettings() {
    try {
      this.props.user.settings = new Settings(this.settings);
      await store.userStore.register(this.props.user);

      this.props.updateSettings(this.settings);
      this.firestore_settings.confirm_leave_meeting =
        this.settings.confirm_leave_meeting;
      this.firestore_settings.copy_invite_link = this.settings.copy_invite_link;
      this.firestore_settings.show_meeting_duration =
        this.settings.show_meeting_duration;
      this.firestore_settings.turn_of_media_devices =
        this.settings.turn_of_media_devices;
      return message.success("Your settings are updated");
    } catch (error) {
      console.log("Settings can not be updated", error);
      return message.success("We can not update your settings now. Try again");
    }
  }

  @computed
  get isUpdateButtonDisabled() {
    if (
      this.settings.confirm_leave_meeting ===
        this.firestore_settings.confirm_leave_meeting &&
      this.settings.copy_invite_link ===
        this.firestore_settings.copy_invite_link &&
      this.settings.show_meeting_duration ===
        this.firestore_settings.show_meeting_duration &&
      this.settings.turn_of_media_devices ===
        this.firestore_settings.turn_of_media_devices
    )
      return true;
    return false;
  }

  @computed
  get isMobile() {
    return !!store.isMobile;
  }

  render() {
    if (!this.is_fetch_complete) {
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
      <div
        style={{ maxHeight: this.isMobile ? "90%" : "" }}
        className="w-full flex flex-col px-10 mobile:p-4 "
      >
        <div className="w-full flex justify-between items-center mt-32 mobile:mt-8">
          <Text
            style={{ fontSize: 30, fontFamily: "Montserrat" }}
            className="text-purple-900"
          >
            Settings
          </Text>
          {!store.isMobile && (
            <div
              className={`mt-5 w-auto mobile:w-full flex items-center 
          justify-center p-5 h-10 rounded bg-purple-800 hover:bg-purple-900 
          text-purple-100 hover:text-purple-50 cursor-pointer ${
            this.isUpdateButtonDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "font-bold"
          } `}
              onClick={() =>
                this.isUpdateButtonDisabled ? null : this.updateSettings()
              }
            >
              Update my settings
            </div>
          )}
        </div>
        <SettingsContainer
          style={{
            overflowY: "hidden",
            overflowY: "auto",
            scrollBehavior: "smooth",
            paddingRight: 8,
            scrollbarWidth: 1,
          }}
        >
          <Row style={{ paddingTop: 16, paddingBottom: 16 }}>
            <Col
              style={{ display: "flex", flexDirection: "column" }}
              span={this.isMobile ? 24 : 12}
            >
              <Divider orientation="left">General</Divider>
              <StyledCheckbox
                style={{ marginBottom: 16 }}
                checked={this.settings.confirm_leave_meeting}
                onChange={(e) => this.onConfirmLeaveMeetingChange(e)}
              >
                Ask me to confirm when I leave meeting
              </StyledCheckbox>
              <StyledCheckbox
                style={{ marginLeft: 0, marginBottom: 16 }}
                checked={this.settings.copy_invite_link}
                onChange={(e) => this.onCopyInviteLinkChange(e)}
              >
                Copy invite link when starting a new meeting
              </StyledCheckbox>
              <StyledCheckbox
                style={{ marginLeft: 0 }}
                checked={this.settings.show_meeting_duration}
                onChange={(e) => this.onShowMeetingDurationChange(e)}
              >
                Show my meeting duration
              </StyledCheckbox>
            </Col>
            <Col
              style={{ display: "flex", flexDirection: "column" }}
              className={`flex column ${this.isMobile ? "mt-5" : ""} `}
              span={this.isMobile ? 24 : 12}
            >
              <Divider orientation="left">Profile</Divider>
              <Text style={{ fontSize: 24 }}>
                {this.props.user.displayName}
              </Text>
              <Text type="secondary">{this.props.user.email}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: 20, paddingBottom: 16 }}>
            <Col span={24} style={{}}>
              <Divider orientation="left">Media Devices</Divider>
              <StyledCheckbox
                checked={this.settings.turn_of_media_devices}
                onChange={(e) => this.onTurnOffMediaDevicesChange(e)}
              >
                Turn of my media devices when joining a meeting
              </StyledCheckbox>
              <div className={` w-full mt-12 flex mobile:flex-col `}>
                <VideoContainer>
                  <Video
                    frameStyle={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "black",
                    }}
                    videoStyles={{
                      objectFit: "cover",
                      height: "100%",
                      width: "100%",
                    }}
                    showMuteControls={false}
                    //ref={this.localVideoref}
                    videoStream={this.localStream}
                    muted={true}
                    autoPlay
                  />
                </VideoContainer>
                <div className="flex flex-1 w-full flex-start ml-8 mobile:ml-0 mobile:mt-5">
                  <StyleContainer>
                    <OptionContainer>
                      <OptionTextContainer>
                        <VideoCameraOutlined
                          style={{
                            height: 20,
                            fontSize: 20,
                            color: "grey",
                            marginRight: 12,
                          }}
                        />
                        <Text>Camera</Text>
                      </OptionTextContainer>
                      <Select
                        defaultValue={
                          this.videoDevices.length
                            ? this.videoDevices[0].label
                            : "Camera source not found"
                        }
                        style={{ width: "100%" }}
                        onClick={() => this.dropDownClick("video")}
                        onChange={(value) => this.handleCameraChange(value)}
                        disabled={!!store.isMobile}
                      >
                        {this.videoDevices.length &&
                          this.videoDevices.map((videoDevice, index) => (
                            <Option key={index} value={videoDevice.label}>
                              {videoDevice.label}
                            </Option>
                          ))}
                      </Select>
                    </OptionContainer>
                    <OptionContainer>
                      <OptionTextContainer>
                        <AudioOutlined
                          style={{
                            height: 20,
                            fontSize: 20,
                            color: "grey",
                            marginRight: 12,
                          }}
                        />
                        <Text>Microphone</Text>
                      </OptionTextContainer>
                      <Select
                        defaultValue={
                          this.microphoneDevices.length
                            ? this.microphoneDevices[0].label
                            : "Microphone source not found"
                        }
                        style={{ width: "100%" }}
                        onClick={() => this.dropDownClick("mic")}
                        onChange={(value) => this.handleMicrophoneChange(value)}
                        disabled={!!store.isMobile}
                      >
                        {this.microphoneDevices.length &&
                          this.microphoneDevices.map(
                            (microphoneDevice, index) => (
                              <Option
                                key={index}
                                value={microphoneDevice.label}
                              >
                                {microphoneDevice.label}
                              </Option>
                            )
                          )}
                      </Select>
                    </OptionContainer>
                    <OptionContainer>
                      <OptionTextContainer>
                        <SoundOutlined
                          style={{
                            height: 20,
                            fontSize: 20,
                            color: "grey",
                            marginRight: 12,
                          }}
                        />
                        <Text>Speaker</Text>
                      </OptionTextContainer>
                      <Select
                        defaultValue={
                          this.speakerDevices.length
                            ? this.speakerDevices[0].label
                            : "Speaker source not found"
                        }
                        style={{ width: "100%" }}
                        onClick={() => this.dropDownClick("speaker")}
                        onChange={(value) => this.handleSpeakerChange(value)}
                        disabled={!!store.isMobile}
                      >
                        {this.speakerDevices.length &&
                          this.speakerDevices.map((speakerDevice, index) => (
                            <Option key={index} value={speakerDevice.label}>
                              {speakerDevice.label}
                            </Option>
                          ))}
                      </Select>
                    </OptionContainer>
                  </StyleContainer>
                </div>
              </div>
            </Col>
          </Row>
          {!!store.isMobile && (
            <div
              className={`mt-5 w-full flex items-center 
            justify-center p-5 h-10 rounded bg-purple-800 hover:bg-purple-900 
            text-purple-100 hover:text-purple-50 cursor-pointer ${
              this.isUpdateButtonDisabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "font-bold"
            } `}
              onClick={() =>
                this.isUpdateButtonDisabled ? null : this.updateSettings()
              }
            >
              Update my settings
            </div>
          )}
        </SettingsContainer>
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

const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  /* align-items: center; */
  padding-left: 60px;
  padding-right: 60px;
`;

const TitleContainer = styled.div`
  width: 100%;
  /* height: 64px; */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  /* align-items: center; */
  margin-top: 140px;
`;

const SettingsContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  ::-webkit-scrollbar {
    width: 0px;
  }
  ::-webkit-scrollbar-track {
  }
  ::-webkit-scrollbar-thumb {
  }
`;

const VideoContainer = styled.div`
  display: flex;
  flex: 1 1 0;
  justify-content: flex-start;
`;

const StyleContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  /* justify-content: space-between; */
`;

const OptionContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const OptionTextContainer = styled.div`
  width: 100%;
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export default SettingsScreen;
