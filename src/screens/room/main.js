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
  Popover,
  Tooltip,
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
  InfoOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  FundProjectionScreenOutlined,
  UsergroupAddOutlined,
  MoreOutlined,
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
import { antLoaderIcon } from "App.js";

let electron;
let desktop_capturer;
const is_electron = isElectron();
if (is_electron) {
  electron = window.require("electron");
  const { ipcRenderer } = window.require("electron");
  desktop_capturer = {
    getSources: (opts) =>
      ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", {
        types: ["window", "screen"],
      }),
  };
}
const { Text, Title } = Typography;
const { Header, Content, Sider, Footer } = Layout;
const { SubMenu } = Menu;

const FOOTER_HEIGHT = store.isMobile ? "80px" : "80px";

@observer
class RoomScreen extends React.Component {
  @observable ICON_SIZE = store.isMobile ? 16 : 20;

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
  @observable records = [];
  @observable shareVisible = false;
  @observable isSharing = false;
  @observable isLeaving = false;

  @observable showRoomInfoModalDialog = false;

  @observable pc_config = {
    iceServers: [
      {
        urls: "stun:relay.metered.ca:80",
      },
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:global.stun.twilio.com:3478",
      },
      {
        urls: "turn:relay.metered.ca:80",
        username: "6c09095bdf2837a7cf0ba812",
        credential: "6DTZGIGLOtqPVB6q",
      },
      {
        urls: "turn:relay.metered.ca:443",
        username: "6c09095bdf2837a7cf0ba812",
        credential: "6DTZGIGLOtqPVB6q",
      },
      {
        urls: "turn:relay.metered.ca:443?transport=tcp",
        username: "6c09095bdf2837a7cf0ba812",
        credential: "6DTZGIGLOtqPVB6q",
      },
      // {
      //   url: "stun:stun.l.google.com:19302",
      // },
      // {
      //   urls: "turn:openrelay.metered.ca:80",
      //   username: "openrelayproject",
      //   credentials: "openrelayproject",
      // },
      // {
      //   urls: "turn:54.204.242.200:3478",
      //   credential: "guest",
      //   username: "somepassword",
      // },
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

  @observable isLoading = true;
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
    });

    this.socket.on("joined-peers", (data) => {});

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
        options: { mirror: true },
      });

      console.log("stream", stream);

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

      // console.log(stream);
      stream.getTracks().forEach((track) => {
        console.log("track", track);
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
      this.isLoading = false;
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
      this.isLoading = true;
      this.isLeaving = true;

      this.socket.close();
      this.stopTracks(this.localStream);
      this.remoteStreams.forEach((rVideo) => this.stopTracks(rVideo.stream));
      this.peerConnections &&
        Object.values(this.peerConnections).forEach((pc) => pc.close());

      await this.fetchRoomInformation();
      this.user.past_meetings.push({
        meeting_id: this.room.room_id,
        host_displayName: this.room.host_displayName,
        createdAt: this.room.createdAt,
        finishedAt: moment().format(),
        participant_list: this.participant_list,
        records: this.records,
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
    this.isLoading = false;
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
      try {
        // const sources = await electron.desktopCapturer.getSources({
        //   types: ["window", "screen"],
        // });
        const sources = await desktop_capturer.getSources();

        this.desktopSources = sources;
        await this.setScreens();
      } catch (error) {
        console.log("is electron share screen error", error);
      }
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

  @computed
  get videoCount() {
    return (this.remoteStreams.length || 0) + 1;
  }

  @computed
  get gridLayout() {
    if (this.videoCount === 1)
      return "grid grid-cols-1 grid-rows-1 h-full w-full";
    else if (this.videoCount === 2) {
      if (store.isMobile) return "grid grid-cols-1 grid-rows-2 h-full w-full";
      else {
        return "grid grid-cols-2 grid-rows-1 h-full w-full";
      }
    } else if (this.videoCount === 3)
      return "grid grid-cols-2 grid-rows-2 h-full w-full";
    else if (this.videoCount === 4)
      return "grid grid-cols-2 grid-rows-2 h-full w-full";
  }

  @computed
  get participantPopoverContent() {
    return (
      <div className="w-full h-full flex flex-col gap-2 ">
        {this.current_participant_list?.map((participant) => (
          <div
            key={participant.uid}
            className="flex gap-2 justify-start items-center py-2 px-4 hover:bg-purple-800 hover:text-white"
          >
            <UserOutlined />
            {participant.displayName}
          </div>
        ))}
      </div>
    );
  }

  @computed
  get settingsPopoverContent() {
    return (
      <div className="w-full h-full flex flex-col gap-3 ">
        <div className="flex flex-col gap-1">
          <div className="text-purple-500 px-3 py-2">Microphone Sources</div>
          {this.selectedMicSource && (
            <div className="cursor-pointer py-2 px-4 hover:bg-purple-800 hover:text-white">
              {this.selectedMicSource.label}
            </div>
          )}
          {this.microphoneDevices.length &&
            this.microphoneDevices.map((md) => (
              <div
                key={md.deviceId}
                onClick={() => this.changeMicSource(md, false)}
                className="py-2 px-4 hover:bg-purple-800 hover:text-white cursor-pointer"
              >
                {md.label}
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-purple-500 px-3 py-2">Speaker Sources</div>
          {this.selectedSpeakerSource && (
            <div className="cursor-pointer py-2 px-4 hover:bg-purple-800 hover:text-white">
              {this.selectedSpeakerSource.label}
            </div>
          )}
          {!!this.speakerDevices.length &&
            this.speakerDevices.map((md) => (
              <div
                key={md.deviceId}
                onClick={() => this.changeSpeakerSource(md, false)}
                className="py-2 px-4 hover:bg-purple-800 hover:text-white cursor-pointer"
              >
                {md.label}
              </div>
            ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-purple-500 px-3 py-2">Camera Sources</div>
          {this.selectedVideoSource && (
            <div className="cursor-pointer py-2 px-4 hover:bg-purple-800 hover:text-white">
              {this.selectedVideoSource.label}
            </div>
          )}
          {!!this.videoDevices.length &&
            this.videoDevices.map((md) => (
              <div
                key={md.deviceId}
                onClick={() => this.changeVideoSource(md, false)}
                className="py-2 px-4 hover:bg-purple-800 hover:text-white cursor-pointer"
              >
                {md.label}
              </div>
            ))}
        </div>
      </div>
    );
  }

  @computed
  get morePopoverContent() {
    return (
      <div className="w-full h-full flex flex-col gap-2 ">
        <div
          className="cursor-pointer flex gap-2 justify-start items-center py-2 px-4 hover:bg-purple-800 hover:text-white"
          onClick={this.showRoomInfoModal}
        >
          <InfoCircleOutlined stlye={{ width: 64 }} />
          Show Room Info
        </div>
        <StyledPopover
          content={this.settingsPopoverContent}
          trigger="hover"
          overlayClassName="popover-style"
          placement="right"
        >
          <div className="cursor-pointer flex gap-2 justify-start items-center py-2 px-4 hover:bg-purple-800 hover:text-white">
            <SettingOutlined />
            Settings
          </div>
        </StyledPopover>

        <div
          className="cursor-pointer flex gap-2 justify-start items-center py-2 px-4 text-red-500 hover:bg-white"
          onClick={this.showModal}
        >
          <LogoutOutlined />
          Leave Room
        </div>
      </div>
    );
  }

  render() {
    if (this.isLoading) {
      return (
        <SpinnerContainer style={{ color: "rgb(109 40 217)" }}>
          <Spin
            style={{ color: "rgb(109 40 217)" }}
            tip={this.isLeaving ? "Leaving Room..." : "Joining Room..."}
            size="large"
            indicator={antLoaderIcon}
          />
        </SpinnerContainer>
      );
    }

    return (
      <Container
        showDrawer={this.showDrawer}
        className={`h-screen flex flex-col`}
      >
        <VideoContainer className={`w-full grid ${this.gridLayout}`}>
          <div
            style={{ position: "relative" }}
            onDoubleClick={this.doubleClick}
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
                position: "absolute",
                bottom: 10,
                left: 15,
                fontSize: "12px",
              }}
              className="p-1 rounded bg-purple-200 text-purple-800"
            >
              {this.user.displayName}
            </Text>
          </div>
          <Videos remoteStreams={this.remoteStreams} />
        </VideoContainer>
        <div
          style={{ height: FOOTER_HEIGHT }}
          className="w-full flex justify-center gap-4 items-center bg-purple-800"
        >
          <StyledPopover
            content={this.participantPopoverContent}
            trigger="hover"
            overlayClassName="popover-style"
          >
            <div className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all">
              <UsergroupAddOutlined style={{ fontSize: this.ICON_SIZE }} />
            </div>
          </StyledPopover>

          {!store.isMobile && (
            <Tooltip
              placement="topLeft"
              title={this.isSharing ? "End Share" : "Share Screen"}
              trigger="hover"
              overlayClassName="tooltip-style"
            >
              <div
                className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all"
                onClick={
                  this.shareVisible
                    ? () => this.changeSharingStatus(false)
                    : () => this.changeSharingStatus(true)
                }
              >
                <FundProjectionScreenOutlined
                  style={{ fontSize: this.ICON_SIZE }}
                  className={`${this.isSharing ? "text-green-500" : "white"}`}
                />
                {/* {this.isSharing ? "End Share" : "Share Screen"} */}
              </div>
            </Tooltip>
          )}

          {!store.isMobile && (
            <Tooltip
              placement="topLeft"
              title={this.recordModalVisible ? "Stop Recording" : "Record"}
              trigger="hover"
              overlayClassName="tooltip-style"
            >
              <div
                className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all"
                onClick={
                  this.recordModalVisible
                    ? () => this.showRecordModalVisible(false)
                    : () => this.showRecordModalVisible(true)
                }
              >
                <EyeOutlined
                  style={{ fontSize: this.ICON_SIZE }}
                  className={`${
                    this.recordModalVisible ? "text-green-500" : "white"
                  }`}
                />
                {/* {this.recordModalVisible ? "Stop Recording" : "Record"} */}
              </div>
            </Tooltip>
          )}

          <Tooltip
            placement="topLeft"
            title={
              store.isMobile
                ? null
                : this.is_camera_open
                ? "Close Camera"
                : "Open Camera"
            }
            trigger="hover"
            overlayClassName="tooltip-style"
          >
            <div
              className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all"
              onClick={this.changeCameraStatus}
            >
              <VideoCameraOutlined
                style={{ fontSize: this.ICON_SIZE }}
                className={`${
                  this.is_camera_open ? "text-green-500" : "text-red-500"
                }`}
              />
              {/* Camera */}
            </div>
          </Tooltip>

          <Tooltip
            placement="topLeft"
            title={
              store.isMobile
                ? null
                : this.is_microphone_open
                ? "Close Microphone"
                : "Open Microphone"
            }
            trigger="hover"
            overlayClassName="tooltip-style"
          >
            <div
              className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all"
              onClick={this.changeMicStatus}
            >
              {this.is_microphone_open ? (
                <AudioOutlined
                  className="text-green-500"
                  style={{ fontSize: this.ICON_SIZE }}
                />
              ) : (
                <AudioMutedOutlined
                  style={{ fontSize: this.ICON_SIZE }}
                  className="text-red-500"
                />
              )}
              {/* Microphone */}
            </div>
          </Tooltip>

          <Tooltip
            placement="topLeft"
            title={
              store.isMobile
                ? null
                : this.showDrawer
                ? "Close Chat"
                : "Open Chat"
            }
            trigger="hover"
            overlayClassName="tooltip-style"
          >
            <div
              className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all"
              onClick={this.changeModalVisibility}
            >
              <WechatOutlined
                className={this.showDrawer ? "text-green-500" : ""}
                style={{ fontSize: this.ICON_SIZE }}
              />
              {/* Chat */}
            </div>
          </Tooltip>

          <StyledPopover
            content={this.morePopoverContent}
            overlayClassName="popover-style"
          >
            <div className="flex gap-2 items-center text-white font-semibold cursor-pointer hover:text-purple-900 hover:bg-purple-200 p-2 rounded transition-all">
              <MoreOutlined style={{ fontSize: this.ICON_SIZE }} />
            </div>
          </StyledPopover>
        </div>

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

        <Modal
          title="Confirm"
          visible={this.showModalDialog}
          onOk={this.leaveRoom}
          onCancel={this.hideModal}
          okText="Yes"
          cancelText="No"
          okButtonProps={{
            style: { backgroundColor: "rgb(126 34 206)", border: 0 },
          }}
          className="rounded-lg"
        >
          {" "}
          Are you sure you want to leave the meeting?
        </Modal>

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
          desktopCapturer={desktop_capturer}
          recordModalVisible={this.recordModalVisible}
          showRecordModalVisible={this.showRecordModalVisible}
          micStatus={this.is_microphone_open}
          isItRecording={this.isItRecording}
          isRecording={this.isRecording}
          remoteStreams={this.remoteStreams}
          roomId={this.roomID}
          records={this.records}
        />

        <DrawerComponent
          room_id={this.roomID}
          user={this.user}
          showDrawer={this.showDrawer}
          changeModalVisibility={this.changeModalVisibility}
        />
      </Container>
    );
  }
}

const Container = styled.div`
  width: ${(props) =>
    !!props.showDrawer ? "calc(100vw - 450px) !important" : "100vw !important"};
`;

const VideoContainer = styled.div`
  height: calc(100vh - 80px) !important;
`;

const StyledPopover = styled(Popover)``;

// OLD
const SpinnerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
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

export default RoomScreen;
