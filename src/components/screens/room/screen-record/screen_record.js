import React from "react";
import RecordRTC, { MediaStreamRecorder } from "recordrtc";
import { Typography, Modal, notification, Spin } from "antd";
import styled from "styled-components";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import Video from "../../room/video/index";
import minimist from "minimist";
import { Web3Storage, getFilesFromPath } from "web3.storage";
import { antLoaderIcon } from "App";

const { Text } = Typography;
let recorder;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

@observer
class ScreenRecording extends React.Component {
  TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDU4MjFENzAyOGVBODBlNzEwQjgyZTE0MjMxOGU3OGEzY0M1OGJFY0QiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjgzNDI4ODQwNjQsIm5hbWUiOiJ3ZWIzcnRjIn0.h5MIRY6GrWQWht4t6AyewqoER0DCURRQUpdb9WAEeAc";
  @observable recordedVideoUrl = null;
  @observable isOpenVideoModal = false;
  @observable stream = null;
  @observable screen = null;
  @observable camera = null;
  @observable recorder = null;
  @observable loadModal = false;
  @observable desktopStreams = [];
  @observable screenTrack = null;
  @observable recordPreview;
  @observable desktopSources;
  @observable remoteAudioTracks = [];

  @observable isRecodUploading = false;

  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.recordModalVisible &&
      prevProps.recordModalVisible !== this.props.recordModalVisible
    ) {
      this.invokeGetDisplayMedia();
    }

    if (!this.props.recordModalVisible && this.props.isRecording) {
      this.stop();
    }

    if (this.props.remoteStreams.length) {
      this.props.remoteStreams.forEach((remoteStream) => {
        //console.log(remoteStream.stream.getAudioTracks());
        //console.log(remoteStream.stream.getVideoTracks());

        this.remoteAudioTracks.push(remoteStream.stream.getAudioTracks()[0]);
      });
    }
  }

  @action.bound
  async captureCamera(cb) {
    // try {
    //     if(MediaStreamConstraints.audio == false && MediaStreamConstraints.video == false){
    //        //notification
    //     }
    // } catch (error) {
    //    console.log(error);
    // }

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false, //make it true for video
      })
      .then(cb);
  }

  @action.bound
  micCamSettings() {}

  @action.bound
  async invokeGetDisplayMedia() {
    if (!this.props.micStatus) {
      notification.warning({
        message: `Notification`,
        description: "Your microphone needs to be open!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
      this.props.showRecordModalVisible(false);

      return;
    }

    var displaymediastreamconstraints = {
      video: {
        displaySurface: "monitor", // monitor, window, application, browser
        logicalSurface: true,
        cursor: "always", // never, always, motion
      },
    };

    displaymediastreamconstraints = {
      video: true,
      audio: true,
    };

    if (this.props.is_electron) {
      try {
        const sources = await this.props.desktopCapturer.getSources();
        this.desktopSources = sources;
        this.setScreens();
      } catch (error) {
        console.log("an error occured in recording electron: ", error);
      }
    } else {
      try {
        this.screen = await navigator.mediaDevices.getDisplayMedia(
          displaymediastreamconstraints
        );

        this.remoteAudioTracks.forEach((audioTrack) => {
          this.screen.addTrack(audioTrack);
        });

        //console.log(this.screen.getAudioTracks());

        if (this.screen) {
          this.captureScreen(this.screen);
        }
      } catch (error) {
        this.props.showRecordModalVisible(false);
        console.log("an error occured in recording web: ", error);
      }
    }
  }

  @action.bound
  captureScreen(screen) {
    try {
      this.addStreamStopListener(screen, () => {});
      this.startScreenRecord(screen);
    } catch (error) {
      console.log("an error occured in recording2: ", error);
    }
  }

  @action.bound
  async startScreenRecord(screen) {
    this.captureCamera(async (camera) => {
      screen.width = window.screen.width;
      screen.height = window.screen.height;
      screen.fullcanvas = true;
      camera.width = 320; //kamera görüntüsünü kaydediyor boyutunu ayarlıyor
      camera.height = 240;
      camera.top = screen.height - camera.height;
      camera.left = screen.width - camera.width;

      this.screen = screen;
      this.camera = camera;

      this.recorder = RecordRTC([screen, camera], {
        type: "canvas",
        mimeType: "video/webm;codecs=vp9",
        getNativeBlob: true,
      });
      this.recorder.startRecording();
      this.recorder.screen = screen;
    });
    this.props.isItRecording(true);
  }

  @action.bound
  async setScreens() {
    await this.desktopSources.map(async (source, index) => {
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

      if (stream.name === "Web3RTC") {
        this.remoteAudioTracks.forEach((audioTrack) => {
          stream.addTrack(audioTrack);
        });
        this.captureScreen(stream);
      }
    });

    return;
  }

  @action.bound
  addStreamStopListener(stream, callback) {
    stream.addEventListener(
      "ended",
      () => {
        callback();
        callback = () => {};
      },
      false
    );
    stream.addEventListener(
      "inactive",
      () => {
        callback();
        callback = () => {};
      },
      false
    );
    stream.getTracks().forEach((track) => {
      track.addEventListener(
        "ended",
        () => {
          callback();
          callback = () => {};
        },
        false
      );
      track.addEventListener(
        "inactive",
        () => {
          callback();
          callback = () => {};
        },
        false
      );
    });
    stream.getVideoTracks()[0].onended = () => {
      this.stop();
    };
  }

  @action.bound
  async stop() {
    this.recorder.stopRecording(this.stopRecordingCallback);
    this.props.isItRecording(false);
    if (!this.props.is_electron) {
      this.props.showRecordModalVisible(false);
    }
  }

  @action.bound
  async stopRecordingCallback() {
    await this.stopLocalVideo(this.screen, this.camera);
    let recordedVideoUrl;
    if (this.recorder.getBlob()) {
      this.recordPreview = this.recorder.getBlob();

      recordedVideoUrl = URL.createObjectURL(this.recorder.getBlob());
    }

    this.recordedVideoUrl = recordedVideoUrl;
    this.screen = null;
    this.isOpenVideoModal = true;
    this.camera = null;

    await this.downloadScreenRecordVideo();

    this.recorder.screen.stop();
    this.recorder.destroy();
    this.recorder = null;
  }

  @action.bound
  async stopLocalVideo(screen, camera) {
    [screen, camera].forEach(async (stream) => {
      stream.getTracks().forEach(async (track) => {
        track.stop();
      });
    });
  }

  @action.bound
  async downloadScreenRecordVideo() {
    let recorderBlob = this.recordPreview;
    if (!recorderBlob) {
      return;
    }
    if (isSafari) {
      if (recorderBlob && recorderBlob.getDataURL) {
        recorderBlob.getDataURL(function (dataURL) {
          RecordRTC.SaveToDisk(dataURL, this.getFileName("mp4"));
        });
        return;
      }
    }
    if (recorderBlob) {
      // recorderBlob.mimeType = { video: "video/webm" };
      var blob = recorderBlob;

      const fileName = `${this.props.roomId}-meeting-record.webm`;
      var file = new File([blob], fileName, {
        type: "video/webm",
      });

      try {
        this.isRecodUploading = true;
        const storage = new Web3Storage({ token: this.TOKEN });
        const cid = await storage.put([file]);

        this.props.records.push({
          name: fileName,
          cid: cid,
        });
      } catch (error) {
        console.log("error web3stor", error);
      } finally {
        this.isRecodUploading = false;
      }

      RecordRTC.invokeSaveAsDialog(file);
    }
  }

  @action.bound
  getFileName(fileExtension) {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var date = d.getDate();
    return (
      "ScreenRecord-" +
      year +
      month +
      date +
      "-" +
      this.getRandomString() +
      "." +
      fileExtension
    );
  }

  @action.bound
  getRandomString() {
    if (
      window.crypto &&
      window.crypto.getRandomValues &&
      navigator.userAgent.indexOf("Safari") === -1
    ) {
      var a = window.crypto.getRandomValues(new Uint32Array(3)),
        token = "";
      for (var i = 0, l = a.length; i < l; i++) {
        token += a[i].toString(36);
      }
      return token;
    } else {
      return (Math.random() * new Date().getTime())
        .toString(36)
        .replace(/\./g, "");
    }
  }

  render() {
    if (this.isRecodUploading) {
      return (
        <RecordLoader>
          <Spin
            tip="Your record file is uploading to web3.storage..."
            size="large"
            style={{ color: "rgb(109 40 217)" }}
            indicator={antLoaderIcon}
          />
        </RecordLoader>
      );
    }
    return <div></div>;
  }
}

const RecordLoader = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: black;
  opacity: 0.65;
  z-index: 9999;
`;

export default ScreenRecording;
