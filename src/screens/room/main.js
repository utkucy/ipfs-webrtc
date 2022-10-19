import React from "react";
import io from "socket.io-client";
import styled, { keyframes, css } from "styled-components";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import {
  Button,
  Input,
  Modal,
  Typography,
  Spin,
  message,
  Layout,
  Menu,
  notification,
} from "antd";
import { Cookies } from "react-cookie";
import { CopyToClipboard } from "react-copy-to-clipboard";
import moment from "moment";

import {
  WechatOutlined,
  FileOutlined,
  UserOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  SoundOutlined,
  SettingOutlined,
  AudioMutedOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import DrawerComponent from "../../components/screens/room/room-drawer/drawer.js";
import { isElectron } from "../../utils";
import "./room.css";
import { Room } from "../../models/room";
import Videos from "../../components/screens/room/videos";
import Video from "../../components/screens/room/video";
import { User } from "../../models/user";
import ScreenRecording from "../../components/screens/room/screen-record/screen_record";
import { store } from "store/index.ts";

let electron;
const is_electron = isElectron();
if (is_electron) {
  electron = window.require("electron");
}
const { Text, Title } = Typography;
const { Header, Content, Sider, Footer } = Layout;
const { SubMenu } = Menu;

@observer
class RoomScreen extends React.Component {
  @observable socket = null;
  @observable localStream = null; // used to hold local stream object to avoid recreating the stream everytime a new offer comes
  @observable remoteStream = null; // used to hold remote stream object that is displayed in the main screen
  @observable senders = [];
  @observable screenTrack;

  @observable desktopSources = [];
  @observable desktopStreams = [];
  @observable desktopModalVisible = false;

  @observable remoteStreams = []; // holds all Video Streams (all remote streams)
  @observable peerConnections = {}; // holds all Peer Connections
  @observable selectedVideo = null;

  @observable collapsed = false;
  @observable showDrawer = false;
  @observable showModalDialog = false;
  @observable videoDevices = [];
  @observable microphoneDevices = [];
  @observable speakerDevices = [];

  @observable selectedMicSource;
  @observable selectedSpeakerSource;
  @observable selectedVideoSource;

  @observable is_camera_open = true;
  @observable is_microphone_open = true;
  @observable recordModalVisible = false;
  @observable isRecording = false;
  @observable shareVisible = false;
  @observable isSharing = false;

  @observable showRoomInfoModalDialog = false;
  @observable status = "Please wait...";

  @observable pc_config = {
    iceServers: [
      {
        url: "stun:stun.l.google.com:19302",
      },
    ],
  };

  @observable sdpConstraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true,
    },
  };

  @observable value;
  @observable room;
  @observable user;
  @observable participant_list = [];
  @observable current_participant_list = [];
  @observable roomID = this.props.match.params.roomID;
  @observable room_password = this.props.match.params.password;
  @observable connect = false;
  @observable participant_count = 0;
  @observable has_cam = false;

  @observable is_fetch_completed = false;
  @observable time = "";
  @observable timeInterval;

  constructor(props) {
    super(props);

    // DONT FORGET TO CHANGE TO NEW URL
    //  this.serviceIP = 'https://dc5b0dfbfa01.ngrok.io/webrtcPeer'
    this.serviceIP = "https://evening-temple-50127.herokuapp.com/webrtcPeer";
    this.changeModalVisibility = this.changeModalVisibility.bind(this);
    this.showRecordModalVisible = this.showRecordModalVisible.bind(this);
    this.isItRecording = this.isItRecording.bind(this);

    const cookies = new Cookies();
    this.uid = cookies.get("_id");
  }

  async componentDidMount() {
    await this.fetchRoomInformation();
    await this.fetchUser();

    this.socket = io.connect(this.serviceIP, {
      path: "/io/webrtc",
      query: {
        room: this.props.match.params.roomID,
      },
    });

    this.socket.on("connect", async () => {
      await this.updateSocketID();
    });

    this.socket.on("connection-success", (data) => {
      this.getLocalStream();
      // console.log(data.success)
      const status =
        data.peerCount > 1
          ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
          : "Waiting for other peers to connect";
      this.status = status;
    });

    this.socket.on("joined-peers", (data) => {
      this.status =
        data.peerCount > 1
          ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
          : "Waiting for other peers to connect";
    });

    this.socket.on("online-peer", async (socketID) => {
      // console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      const pc = await this.createPeerConnection(
        socketID,
        this.user.displayName
      );
      // 2. Create Offer
      if (pc)
        pc.createOffer(this.sdpConstraints).then((sdp) => {
          pc.setLocalDescription(sdp);

          this.sendToPeer("offer", sdp, {
            local: this.socket.id,
            remote: socketID,
          });
        });
    });

    this.socket.on("offer", async (data) => {
      const pc = await this.createPeerConnection(
        data.socketID,
        this.user.displayName
      );
      pc.addStream(this.localStream);

      pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
        // 2. Create Answer
        pc.createAnswer(this.sdpConstraints).then((sdp) => {
          pc.setLocalDescription(sdp);

          this.sendToPeer("answer", sdp, {
            local: this.socket.id,
            remote: data.socketID,
          });
        });
      });
    });

    this.socket.on("answer", async (data) => {
      const pc = this.peerConnections[data.socketID];
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
        () => {}
      );
    });

    this.socket.on("peer-disconnected", (data) => {
      try {
        // console.log('peer-disconnected', data)

        // close peer-connection with this peer
        this.peerConnections[data.socketID].close();

        // get and stop remote audio and video tracks of the disconnected peer
        const rVideo = this.remoteStreams.filter(
          (stream) => stream.id === data.socketID
        );
        rVideo && this.stopTracks(rVideo[0].stream);

        const remoteStreams = this.remoteStreams.filter(
          (stream) => stream.id !== data.socketID
        );

        this.remoteStreams = remoteStreams;
        this.status =
          data.peerCount > 1
            ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}`
            : "Waiting for other peers to connect";
      } catch (error) {
        console.log("peer-disconnected", error);
      }
    });

    this.socket.on("candidate", (data) => {
      const pc = this.peerConnections[data.socketID];
      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    navigator.mediaDevices.addEventListener("devicechange", this.updateSources);
    if (this.user.settings.show_meeting_duration)
      this.timerInterval = setInterval(this.changeTimer, 1000);
  }

  async componentWillUnmount() {
    navigator.mediaDevices.removeEventListener(
      "devicechange",
      this.updateSources
    );
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.socket.id) {
      this.socket.close();
      this.stopTracks(this.localStream);
      this.remoteStreams.forEach((rVideo) => this.stopTracks(rVideo.stream));
      this.peerConnections &&
        Object.values(this.peerConnections).forEach((pc) => pc.close());
    }
  }

  @action.bound
  async updateSocketID() {
    // console.log(this.socket.id)
    try {
      const participantRef = this.current_participant_list.find(
        (p) => p.uid === this.uid
      );
      if (participantRef) {
        participantRef.socketID = this.socket.id;
      }

      this.room.current_participant_list = this.current_participant_list;

      await store.userStore.createMeeting(this.room);
    } catch (error) {
      console.log("Error updating socket field of user", error);
    }
  }

  @action.bound
  async fetchRoomInformation() {
    try {
      const room = await store.userStore.getRoom(this.roomID);
      //console.log("room", room);
      if (!!room) {
        this.room = new Room(room);
        this.current_participant_list = room.current_participant_list;
        this.participant_list = room.participant_list;
        // console.log(this.current_participant_list);
        // console.log(this.participant_list);
      } else {
        console.log("No such document room", room);
      }
    } catch (error) {
      console.log(error);
    }
  }

  @action.bound
  async fetchUser() {
    try {
      const user = await store.userStore.getUser(this.uid);

      if (user) {
        this.user = new User(user);
        console.log(user);
      } else {
        console.log("No such document user");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  @action.bound
  async getLocalStream() {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      await mediaDevices.forEach((md) => {
        //console.log(md)
        if (md.kind === "audioinput") {
          if (md.deviceId === "default") this.selectedMicSource = md;
          else this.microphoneDevices.push(md);
        } else if (md.kind === "videoinput") {
          if (this.videoDevices.length === 0) this.selectedVideoSource = md;
          else this.videoDevices.push(md);
        } else if (md.kind === "audiooutput") {
          if (md.deviceId === "default") this.selectedSpeakerSource = md;
          else this.speakerDevices.push(md);
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
        options: { mirror: true },
      });
      // console.log(stream);
      stream.getTracks().forEach((track) => {
        if (this.user.settings.turn_of_media_devices) {
          if (track.kind === "video") {
            track.enabled = false;
            this.is_camera_open = false;
            //console.log(track.kind, track.enabled);
          } else if (track.kind === "audio") {
            track.enabled = false;
            this.is_microphone_open = false;
            //console.log(track.kind, track.enabled);
          }
        }
      });
      window.localStream = stream;
      this.localStream = stream;
      this.is_fetch_completed = true;
      this.whoisOnline();
    } catch (error) {
      console.log(error);
    }
  }

  @action.bound
  whoisOnline = () => {
    // let all peers know I am joining
    this.sendToPeer("onlinePeers", null, { local: this.socket.id });
  };

  @action.bound
  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };

  @action.bound
  async createPeerConnection(socketID, displayName) {
    try {
      await this.fetchRoomInformation();
      let pc = new RTCPeerConnection(this.pc_config);

      // add pc to peerCOnnections object
      const peerConnections = { ...this.peerConnections, [socketID]: pc };
      this.peerConnections = peerConnections;

      pc.onicecandidate = (e) => {
        // send the candidates to the remote peer
        if (e.candidate)
          this.sendToPeer("candidate", e.candidate, {
            local: this.socket.id,
            remote: socketID,
          });
      };

      pc.oniceconnectionstatechange = (e) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)
        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }
      };

      pc.ontrack = async (e) => {
        let _remoteStream = null;
        let remoteStreams = this.remoteStreams;
        let remoteVideo = {};

        // 1. check if stream already exists in remoteStreams
        try {
          const rVideos = this.remoteStreams.filter(
            (stream) => stream.id === socketID
          );
          // 2. if it does exist then add track
          if (rVideos.length) {
            _remoteStream = rVideos[0].stream;
            _remoteStream.addTrack(e.track, _remoteStream);
            remoteVideo = {
              ...rVideos[0],
              stream: _remoteStream,
            };
            remoteStreams = this.remoteStreams.map((_remoteVideo) => {
              return (
                (_remoteVideo.id === remoteVideo.id && remoteVideo) ||
                _remoteVideo
              );
            });
          } else {
            // 3. if not, then create new stream and add track
            _remoteStream = new MediaStream();
            _remoteStream.addTrack(e.track, _remoteStream);

            const remoteVideoOwner = this.current_participant_list.find(
              (cp) => cp.socketID === socketID
            );

            console.log("remoteVideoOwner", remoteVideoOwner);

            remoteVideo = {
              id: socketID,
              name: remoteVideoOwner ? remoteVideoOwner.displayName : "",
              stream: _remoteStream,
            };
            remoteStreams = [...this.remoteStreams, remoteVideo];
          }

          const remoteStream =
            this.remoteStreams.length > 0
              ? {}
              : { remoteStream: _remoteStream };
          this.remoteStream = remoteStream.remoteStream;
          this.remoteStreams = remoteStreams;
        } catch (error) {
          console.log("pc.ontrack error", error);
        }
      };

      pc.close = () => {
        //alert("GONE")
      };

      if (this.localStream)
        this.localStream
          .getTracks()
          .forEach((track) =>
            this.senders.push(pc.addTrack(track, this.localStream))
          );
      return pc;
    } catch (error) {
      console.log("Something went wrong! PC not created!!", error);

      return null;
    }
  }

  @action.bound
  stopTracks = (stream) => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  };

  @action.bound
  async leaveRoom() {
    if (this.isSharing || this.isRecording) {
      notification.warning({
        message: `Notification`,
        description:
          "You need to stop screen sharing or recording before leaving meeting!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
      return;
    }

    try {
      await this.fetchRoomInformation();
      this.user.past_meetings.push({
        meeting_id: this.room.room_id,
        host_displayName: this.room.host_displayName,
        createdAt: this.room.createdAt,
        finishedAt: moment().format(),
        participant_list: this.participant_list,
      });

      await store.userStore.register(this.user);

      // Odadan çıkan kullanıcının katılımcılar listesinden silinmesi

      this.current_participant_list = this.current_participant_list.filter(
        (cp) => cp.uid !== this.uid
      );
      this.room.current_participant_list = this.current_participant_list;

      await store.userStore.createMeeting(this.room);
    } catch (error) {
      console.log("Error leaving room", error);
    }
    this.socket.close();
    this.stopTracks(this.localStream);
    this.remoteStreams.forEach((rVideo) => this.stopTracks(rVideo.stream));
    this.peerConnections &&
      Object.values(this.peerConnections).forEach((pc) => pc.close());
    this.props.history.push("/dashboard");
  }

  @action.bound
  onCollapse(collapsed) {
    this.collapsed = collapsed;
  }

  @action.bound
  changeModalVisibility() {
    this.showDrawer = !this.showDrawer;
  }

  @action.bound
  copyInfo() {
    this.value = "Room ID=" + this.props.match.params.roomID.text;
  }

  @action.bound
  async showModal() {
    if (!this.user.settings.confirm_leave_meeting) await this.leaveRoom();
    else this.showModalDialog = true;
  }

  @action.bound
  showRoomInfoModal() {
    this.showRoomInfoModalDialog = true;
  }

  @action.bound
  hideRoomInfoModal() {
    this.showRoomInfoModalDialog = false;
  }

  @action.bound
  hideModal() {
    this.showModalDialog = false;
  }

  @action.bound
  changeSharingStatus(boolean) {
    this.shareVisible = boolean;
    if (this.shareVisible && !this.isSharing) {
      this.shareScreen();
    }
    if (!this.shareVisible && this.isSharing) {
      this.endShare();
    }
  }

  @action.bound
  async shareScreen() {
    if (is_electron) {
      const sources = await electron.desktopCapturer.getSources({
        types: ["window", "screen"],
      });
      this.desktopSources = sources;
      await this.setScreens();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true,
        });
        //navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
        // this.screenTrack = stream.getTracks()[0];
        // this.senders.find(sender => sender.track.kind === 'video').replaceTrack(this.screenTrack);
        this.share(stream);
        this.screenTrack.onended = () => {
          this.screenTrack.stop();
          this.screenTrack = null;
          this.peerConnections &&
            Object.values(this.peerConnections).forEach((pc) => {
              const senders = pc.getSenders();
              senders
                .find((sender) => sender.track.kind === "video")
                .replaceTrack(this.localStream.getTracks()[1]);
            });
          this.isSharing = false;
          this.shareVisible = false;
          //this.senders.find(sender => sender.track.kind === "video").replaceTrack(this.localStream.getTracks()[1]);
        };
        //})
      } catch (error) {
        this.shareVisible = false;
        console.log("an error occured in recording web: ", error);
      }
    }
    this.changeDesktopModalVisibility(true);
  }

  @action.bound
  share(stream) {
    try {
      this.screenTrack = stream.getTracks()[0];
      // this.senders.find(sender => sender.track.kind === 'video').replaceTrack(this.screenTrack);
      this.peerConnections &&
        Object.values(this.peerConnections).forEach((pc) => {
          const senders = pc.getSenders();
          senders
            .find((sender) => sender.track.kind === "video")
            .replaceTrack(this.screenTrack);
        });
      this.isSharing = true;
    } catch (e) {
      console.log("error", e);
    }
    this.changeDesktopModalVisibility(false);
  }

  @action.bound
  endShare() {
    //console.log(this.screenTrack);
    this.screenTrack.stop();
    this.screenTrack = null;
    // this.senders.find(sender => sender.track.kind === "video").replaceTrack(this.localStream.getTracks()[1]);
    this.peerConnections &&
      Object.values(this.peerConnections).forEach((pc) => {
        const senders = pc.getSenders();
        senders
          .find((sender) => sender.track.kind === "video")
          .replaceTrack(this.localStream.getTracks()[1]);
      });
    this.isSharing = false;
  }

  @action.bound
  changeDesktopModalVisibility(boolean) {
    this.desktopModalVisible = boolean;
  }

  @action.bound
  async setScreens() {
    if (this.desktopStreams.length) this.desktopStreams = [];
    await this.desktopSources.map(async (source, index) => {
      // console.log(source);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720,
          },
        },
      });
      stream.display_id = source.display_id;
      stream.name = source.name;

      // console.log(stream);
      this.desktopStreams.push(stream);
    });
  }

  @action.bound
  changeCameraStatus() {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "video") track.enabled = !track.enabled;
    });
    this.is_camera_open = !this.is_camera_open;
  }

  @action.bound
  changeMicStatus() {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "audio") track.enabled = !track.enabled;
    });
    this.is_microphone_open = !this.is_microphone_open;
  }

  @action.bound
  async changeMicSource(md, new_source) {
    await this.updateLocalStream(this.selectedVideoSource, md);

    if (!new_source) {
      this.microphoneDevices = this.microphoneDevices.filter(
        (mediaDevice) => md.deviceId !== mediaDevice.deviceId
      );
      this.microphoneDevices.push(this.selectedMicSource);
      this.selectedMicSource = md;
    }
  }

  @action.bound
  changeSpeakerSource(md, new_source) {
    const videos = document.getElementsByTagName("video");
    //console.log(videos.length);
    for (let i = 0; i < videos.length; i++) {
      videos[i].setSinkId(md.deviceId);
    }
    if (!new_source) {
      this.speakerDevices = this.speakerDevices.filter(
        (mediaDevice) => md.deviceId !== mediaDevice.deviceId
      );
      this.speakerDevices.push(this.selectedSpeakerSource);
      this.selectedSpeakerSource = md;
    }
  }

  @action.bound
  async changeVideoSource(md, new_source) {
    await this.updateLocalStream(md, this.selectedMicSource);

    if (!new_source) {
      this.videoDevices = this.videoDevices.filter(
        (mediaDevice) => md.deviceId !== mediaDevice.deviceId
      );
      this.videoDevices.push(this.selectedVideoSource);
      this.selectedVideoSource = md;
    }
  }

  @action.bound
  async updateLocalStream(videoDevice, micDevice) {
    //console.log(micDevice);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: videoDevice.groupId,
        },
        audio: {
          groupId: micDevice.groupId,
        },
        options: { mirror: true },
      });

      stream.getTracks().forEach((track) => {
        if (track.kind === "video" && !this.is_camera_open)
          track.enabled = false;
        else if (track.kind === "audio" && !this.is_microphone_open)
          track.enabled = false;
      });
      //console.log(stream.getAudioTracks());

      this.localStream.getTracks().forEach((track) => track.stop());
      window.localStream = stream;
      this.localStream = stream;
      //console.log(this.localStream.getTracks());

      this.peerConnections &&
        Object.values(this.peerConnections).forEach((pc) => {
          const senders = pc.getSenders();
          senders
            .find((sender) => sender.track.kind === "audio")
            .replaceTrack(this.localStream.getAudioTracks()[0]);
          senders
            .find((sender) => sender.track.kind === "video")
            .replaceTrack(this.localStream.getVideoTracks()[0]);
        });
    } catch (error) {
      console.log("error at updating local stream", error);
    }
  }

  @action.bound
  async updateSources() {
    let _microphoneDevices = [];
    let _videoDevices = [];
    let _speakerDevices = [];

    let _selectedMicSource;
    let _selectedVideoSource;
    let _selectedSpeakerSource;

    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    mediaDevices.forEach((md) => {
      if (md.kind === "audioinput") {
        if (md.deviceId === "default") _selectedMicSource = md;
        else _microphoneDevices.push(md);
      } else if (md.kind === "videoinput") {
        if (_videoDevices.length === 0) _selectedVideoSource = md;
        else _videoDevices.push(md);
      } else if (md.kind === "audiooutput") {
        if (md.deviceId === "default") _selectedSpeakerSource = md;
        else _speakerDevices.push(md);
      }
    });

    this.microphoneDevices = _microphoneDevices;
    this.selectedMicSource = _selectedMicSource;

    this.videoDevices = _videoDevices;
    this.selectedVideoSource = _selectedVideoSource;

    this.speakerDevices = _speakerDevices;
    this.selectedSpeakerSource = _selectedSpeakerSource;

    await this.changeSpeakerSource(this.selectedSpeakerSource, true);
    await this.updateLocalStream(
      this.selectedVideoSource,
      this.selectedMicSource
    );
  }

  @action.bound
  showRecordModalVisible(boolean) {
    this.recordModalVisible = boolean;
  }

  @action.bound
  isItRecording(boolean) {
    this.isRecording = boolean;
  }

  @action.bound
  changeTimer = () => {
    const now = moment();
    const createdAt = moment(this.room.createdAt);
    let hour = now.diff(createdAt, "hours").toString();
    let min = (now.diff(createdAt, "minutes") % 60).toString();
    let sec = (now.diff(createdAt, "seconds") % 60).toString();

    if (min < 10) min = "0" + min;
    if (sec < 10) sec = "0" + sec;

    if (hour > 0) this.time = hour + ":" + min + ":" + sec;
    else if (hour <= 0) this.time = min + ":" + sec;
  };

  render() {
    if (!this.is_fetch_completed) {
      return (
        <SpinnerContainer>
          <Spin tip="Loading..." size="large" />
        </SpinnerContainer>
      );
    }
    const statusText = (
      <div style={{ color: "black", padding: 5 }}>{this.status}</div>
    );
    return (
      <Layout id="outer-container" style={{ minHeight: "100vh" }}>
        <Sider
          className="sider"
          theme="light"
          collapsible
          collapsed={this.collapsed}
          onCollapse={(collapsed) => this.onCollapse(collapsed)}
        >
          <div className="logo" />
          <Menu
            className="sider"
            defaultSelectedKeys={["1"]}
            mode="vertical"
            selectable={false}
          >
            {this.user.settings.show_meeting_duration && (
              <Menu.Item key="1" icon={<FieldTimeOutlined />} type="primary">
                {this.time}
              </Menu.Item>
            )}

            <Menu.Item
              key="2"
              icon={<WechatOutlined />}
              onClick={this.changeModalVisibility}
            >
              Chat
            </Menu.Item>
            <SubMenu key="sub1" icon={<UserOutlined />} title="Users">
              {this.current_participant_list?.map((participant, index) => (
                <Menu.Item
                  icon={<UserOutlined />}
                  style={{
                    color:
                      participant.uid === this.room.host_id ? "green" : "black",
                  }}
                  key={index}
                >
                  {participant.displayName}{" "}
                </Menu.Item>
              ))}
            </SubMenu>
            <Menu.Item
              key="9"
              icon={<FileOutlined />}
              onClick={
                this.shareVisible
                  ? () => this.changeSharingStatus(false)
                  : () => this.changeSharingStatus(true)
              }
            >
              {this.isSharing ? "End Share" : "Share Screen"}
            </Menu.Item>

            <Menu.Item
              key="10"
              icon={<EyeOutlined />}
              onClick={
                this.recordModalVisible
                  ? () => this.showRecordModalVisible(false)
                  : () => this.showRecordModalVisible(true)
              }
            >
              {this.recordModalVisible ? "Stop Recording" : "Record"}
            </Menu.Item>

            <SubMenu key="11" icon={<SettingOutlined />} title="Settings">
              <Menu.ItemGroup title="Microphone Sources">
                {this.selectedMicSource && (
                  <Menu.Item key="99" style={{ color: "blue" }}>
                    {this.selectedMicSource.label}
                  </Menu.Item>
                )}
                {this.microphoneDevices.length &&
                  this.microphoneDevices.map((md) => (
                    <Menu.Item
                      key={md.deviceId}
                      onClick={() => this.changeMicSource(md, false)}
                    >
                      {md.label}
                    </Menu.Item>
                  ))}
              </Menu.ItemGroup>
              <Menu.Divider />
              <Menu.ItemGroup title="Speaker Sources">
                {this.selectedSpeakerSource && (
                  <Menu.Item style={{ color: "blue" }} key="100">
                    {this.selectedSpeakerSource.label}
                  </Menu.Item>
                )}
                {this.speakerDevices.length &&
                  this.speakerDevices.map((md) => (
                    <Menu.Item
                      key={md.deviceId}
                      onClick={() => this.changeSpeakerSource(md, false)}
                    >
                      {md.label}
                    </Menu.Item>
                  ))}
              </Menu.ItemGroup>
              <Menu.ItemGroup title="Camera Sources">
                {this.selectedVideoSource && (
                  <Menu.Item style={{ color: "blue" }} key="101">
                    {this.selectedVideoSource.label}
                  </Menu.Item>
                )}
                {this.videoDevices.length &&
                  this.videoDevices.map((md) => (
                    <Menu.Item
                      key={md.deviceId}
                      onClick={() => this.changeVideoSource(md, false)}
                    >
                      {md.label}
                    </Menu.Item>
                  ))}
              </Menu.ItemGroup>
            </SubMenu>
            <Menu.Divider />
            <Menu.Item
              key="12"
              icon={
                <VideoCameraOutlined
                  style={{ color: this.is_camera_open ? "#000000" : "#ff4d4f" }}
                />
              }
              onClick={this.changeCameraStatus}
            >
              Camera
            </Menu.Item>
            <Menu.Item
              key="13"
              icon={
                this.is_microphone_open ? (
                  <AudioOutlined />
                ) : (
                  <AudioMutedOutlined style={{ color: "#ff4d4f" }} />
                )
              }
              onClick={this.changeMicStatus}
            >
              Microphone
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              primary="true"
              icon={<CopyOutlined />}
              onClick={this.showRoomInfoModal}
            >
              Show Room Info
            </Menu.Item>

            <Modal
              title="Room Info"
              visible={this.showRoomInfoModalDialog}
              // onOk={this.hideRoomInfoModal}
              // okText="OK"
              onCancel={this.hideRoomInfoModal}
              // cancelText="done"
              maskClosable="true"
              footer={null}
            >
              Room ID: {this.props.match.params.roomID} <br />
              Password: {this.props.match.params.password}
              <CopyToClipboard
                text={
                  "Room ID: " +
                  this.props.match.params.roomID +
                  "\nPassword: " +
                  this.props.match.params.password
                }
              >
                <Button
                  icon={<CopyOutlined />}
                  style={{
                    float: "right",
                    position: "absolute",
                    bottom: "30px",
                    left: "400px",
                  }}
                >
                  Copy
                </Button>
              </CopyToClipboard>
            </Modal>

            <Menu.Item
              danger="true"
              icon={<ArrowLeftOutlined />}
              type="primary"
              onClick={this.showModal}
            >
              Leave
            </Menu.Item>

            <Modal
              title="Confirm"
              visible={this.showModalDialog}
              onOk={this.leaveRoom}
              onCancel={this.hideModal}
              okText="Yes"
              cancelText="No"
            >
              {" "}
              Are you sure you want to leave the meeting?
            </Modal>
          </Menu>
        </Sider>
        <Layout className="site-layout" style={{ overflow: "hidden" }}>
          <Content
            id="content"
            style={{
              margin: "0 0",
              width: this.showDrawer ? "70%" : "100%",
              height: "100vh",
            }}
          >
            {this.isRecording && <RecordButtonContainer />}
            <Modal
              title="Choose your screen"
              visible={this.desktopModalVisible && is_electron}
              width={600}
              onOk={() => this.changeDesktopModalVisibility(false)}
              onCancel={() => this.changeDesktopModalVisibility(false)}
            >
              <DesktopSourceContainer>
                {this.desktopStreams.length &&
                  this.desktopStreams.map((stream, index) => (
                    <SourceOption onClick={() => this.share(stream)}>
                      <Video
                        videoStyles={{
                          width: 200,
                        }}
                        frameStyle={{
                          width: 200,
                          borderRadius: 5,
                          backgroundColor: "black",
                        }}
                        videoStream={stream}
                        muted="true"
                        autoPlay
                      />
                      <Text style={{ textAlign: "center" }}>{stream.name}</Text>
                    </SourceOption>
                  ))}
              </DesktopSourceContainer>
            </Modal>

            <ScreenRecording
              is_electron={is_electron}
              electron={electron}
              recordModalVisible={this.recordModalVisible}
              showRecordModalVisible={this.showRecordModalVisible}
              micStatus={this.is_microphone_open}
              isItRecording={this.isItRecording}
              isRecording={this.isRecording}
              remoteStreams={this.remoteStreams}
            />

            <div
              className="site-layout-background"
              style={{
                padding: 0,
                margin: 16,
                minHeight: 360,
                display: "flex",
              }}
            >
              <Container>
                <Row>
                  <Col>
                    <div
                      onDoubleClick={this.doubleClick}
                      style={{
                        display: "inline-block",
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <Video
                        videoStyles={{
                          objectFit: "cover",
                          height: "100%",
                          width: "100%",
                        }}
                        frameStyle={{
                          backgroundColor: "#ffffff12",
                          // maxWidth: 120,
                          // maxHeight: 120,
                          width: "100%",
                          height: "100%",
                        }}
                        showMuteControls={false}
                        //ref={this.localVideoref}
                        videoStream={this.localStream}
                        muted="true"
                        autoPlay
                      />
                      <Text
                        style={{
                          color: "#1890ff",
                          position: "absolute",
                          bottom: 10,
                          left: 15,
                          fontSize: "12px",
                        }}
                      >
                        {this.user.displayName}
                      </Text>
                    </div>
                  </Col>
                  <Videos remoteStreams={this.remoteStreams} />
                </Row>
                {/* <div class="grid-container">               
                  <div onDoubleClick={this.doubleClick} style={{ display: 'inline-block', width:'100%', height: '100%' }} >
                    <Video
                      videoStyles={{ 
                        objectFit: 'cover',
                        height: '100%',
                        width: '100%',
                      }}
                      frameStyle={{
                        backgroundColor: '#ffffff12',
                        // maxWidth: 120, 
                        // maxHeight: 120,
                        width: '100%', 
                        height: '100%',
                      }}
                      showMuteControls={false}
                      //ref={this.localVideoref} 
                      videoStream={this.localStream}
                      muted="true"
                      autoPlay 
                      /> 
                      <Text style={{ textAlign: 'center', fontSize:'12px',}} >{this.user.displayName}</Text> 
                  </div>
                  <Videos remoteStreams={this.remoteStreams}/>     
                 </div>  */}

                {/* <div class="grid-container-screen-share">
                  <div class="screenSharingUser">
                  <Video
                      videoStyles={{ 
                        objectFit: 'cover',
                        height: '100%',
                        width: '100%',
                      }}
                      frameStyle={{
                        backgroundColor: '#ffffff12',
                        // maxWidth: 120, 
                        // maxHeight: 120,
                        width: '100%', 
                        height: '100%',
                        padding: '0 3px',
                      }}
                      showMuteControls={false}
                      //ref={this.localVideoref} 
                      videoStream={this.localStream}
                      muted="true"
                      autoPlay 
                      /> 
                  </div>
                  <div class="user">
                  <Videos remoteStreams={this.remoteStreams}/>     

                  </div>
                </div> */}

                <br />
              </Container>
            </div>
            <DrawerComponent
              room_id={this.roomID}
              user={this.user}
              showDrawer={this.showDrawer}
              changeModalVisibility={this.changeModalVisibility}
            />
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
  width: 100%;
  height: 100%;
  display: flex;
`;

const StatusTextContainer = styled.div`
  margin: 10px;
  background-color: #cdc4ff4f;
  padding: 10px;
  border-radius: 5px;
`;

const RoomText = styled.h1`
  display: flex;
  padding: 0;
  margin: 0;
  width: 100%;
  height: auto;
`;

const DesktopSourceContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
`;

const SourceOption = styled.div`
  width: 200px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;

  &:hover {
    border: 4px solid #52c41a;
    width: 214px;
  }
`;

function blinkingEffect() {
  return keyframes`
    50% {
      opacity: 0;
    }
  `;
}

const RecordButtonContainer = styled.div`
  height: 15px;
  width: 15px;
  //border-width: 5px;
  border-radius: 50%;
  position: absolute;
  top: 10px;
  left: 218px;
  background-color: red;
  animation: ${blinkingEffect} 1s linear infinite;
`;

const Row = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  background-color: rgb(234, 236, 230);
  flex-wrap: wrap;
`;

const Col = styled.div`
  width: 50%;
  height: 50%;
  display: flex;
  border: 2px solid #1890ff;
`;

export default RoomScreen;
