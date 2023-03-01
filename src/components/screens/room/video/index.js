import React, { Component } from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import { Typography } from "antd";
import styled, { css } from "styled-components";

const { Text } = Typography;

@observer
class Video extends Component {
  @observable mic = true;
  @observable camera = true;
  @observable videoVisible = true;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.videoStream) {
      this.video.srcObject = this.props.videoStream;
    }

    if (this.props.videoStream) {
      const videoTrack = this.props.videoStream.getVideoTracks();
      if (
        this.props.videoType === "remoteVideo" &&
        videoTrack &&
        videoTrack.length
      ) {
        videoTrack[0].onmute = () => {
          this.videoVisible = false;
          this.video.srcObject = undefined;
        };

        videoTrack[0].onunmute = () => {
          this.videoVisible = true;
          this.video.srcObject = this.props.videoStream;
        };
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    // This is done only once
    if (
      nextProps.videoStream &&
      nextProps.videoStream !== this.props.videoStream
    ) {
      // if (!this.props.videoStream) {
      //  console.log('2', this.props.videoType, nextProps.videoStream)
      this.video.srcObject = nextProps.videoStream;
    }

    // This is done only once when we receive a video track
    const videoTrack =
      nextProps.videoStream && nextProps.videoStream.getVideoTracks();
    if (
      this.props.videoType === "remoteVideo" &&
      videoTrack &&
      videoTrack.length
    ) {
      videoTrack[0].onmute = () => {
        this.videoVisible = false;
      };

      videoTrack[0].onunmute = () => {
        this.videoVisible = true;
      };
    }

    const audioTrack =
      nextProps.videoStream && nextProps.videoStream.getAudioTracks();
    if (
      this.props.videoType === "remoteVideo" &&
      audioTrack &&
      audioTrack.length
    ) {
      audioTrack[0].onmute = () => {
        alert("muted");
        // this.setState({
        //   videoVisible: false,
        // })
        // this.props.videoMuted(nextProps.videoStream)
      };
    }
  }

  @action.bound
  mutemic(e) {
    const stream = this.video.srcObject
      .getTracks()
      .filter((track) => track.kind === "audio");
    if (stream) stream[0].enabled = !this.mic;
    this.mic = !this.mic;
  }

  @action.bound
  mutecamera(e) {
    const stream = this.video.srcObject
      .getTracks()
      .filter((track) => track.kind === "video");
    if (stream) stream[0].enabled = !this.camera;
    this.camera = !this.camera;
  }

  @action.bound
  makeFullScreen() {
    if (this.video.requestFullscreen) {
      this.video.requestFullscreen();
    } else if (this.video.webkitRequestFullscreen) {
      /* Safari */
      this.video.webkitRequestFullscreen();
    } else if (this.video.msRequestFullscreen) {
      /* IE11 */
      this.video.msRequestFullscreen();
    }
  }

  render() {
    return (
      <div
        style={{
          ...this.props.frameStyle,
          width: "100%",
          height: "100%",
          backgroundColor: "black",
          position: "relative",
        }}
        onDoubleClick={this.makeFullScreen}
      >
        {/* <audio id={this.props.id} muted={this.props.muted} ref={ (ref) => {this.video = ref }}></audio> */}
        <video
          id={this.props.id}
          muted={this.props.muted}
          autoPlay
          style={{
            visibility: (this.videoVisible && "visible") || "hidden",
            ...this.props.videoStyles,
            width: "100%",
            height: "100%",
            backgroundColor: "black",
          }}
          // ref={ this.props.videoRef }
          ref={(ref) => {
            this.video = ref;
          }}
          webkit-playsinline="true"
          playsinline="true"
        ></video>
        <Text
          style={{
            position: "absolute",
            bottom: 10,
            left: 15,
            fontSize: "12px",
          }}
          className="p-1 rounded bg-purple-200 text-purple-800"
        >
          {this.props.name ? this.props.name : " "}
        </Text>
        {/* {!this.videoVisible && <div style={{ width:'100%', height:'100%', backgroundColor: 'black' }} />} */}
      </div>
    );
  }
}

export default Video;
