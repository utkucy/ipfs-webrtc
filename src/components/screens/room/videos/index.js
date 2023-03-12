import React, { Component } from "react";
import styled from "styled-components";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";

import Video from "../video";
import { store } from "store";

@observer
class Videos extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        {this.props.remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream
            .getTracks()
            .filter((track) => track.kind === "video");
          return (
            <div
              id={rVideo.id}
              style={{
                cursoer: "pointer",
                display: "inline-block",
                width: "100%",
                height: "100%",
              }}
              key={index}
              className={`${
                this.props.remoteStreams.length === 2 && index === 1
                  ? "col-span-full"
                  : ""
              }`}
            >
              {(_videoTrack && (
                <Video
                  videoType="remoteVideo"
                  videoStream={rVideo.stream}
                  rVideo={rVideo}
                  name={rVideo.name}
                  frameStyle={{
                    backgroundColor: "#ffffff12",
                    // maxWidth: 120,
                    // maxHeight: 120,
                    width: "100%",
                    height: "100%",
                  }}
                  videoStyles={{
                    // cursor: 'pointer',
                    objectFit: "cover",
                    // maxWidth: 120,
                    // maxHeight: 120,
                    height: "100%",
                    // borderRadius: 5,
                    width: "100%",
                  }}
                  // autoPlay
                  alignCenter={
                    this.props.remoteStreams.length === 2 && index === 1
                  }
                />
              )) || <div></div>}
              {/* { <h1>{rVideo.name}</h1> } */}
            </div>
          );
        })}
      </>
    );
  }
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Col = styled.div`
  width: 50%;
  height: 50%;
  display: flex;
  border: 2px solid #1890ff;
`;

export default Videos;
