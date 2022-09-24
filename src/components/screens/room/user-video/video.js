import React from "react";
import styled from "styled-components";
import Peer from "simple-peer";

class Video extends React.Component {

  constructor(props) {
    super(props)
    this.ref = React.createRef()

  }

  componentDidMount() {
    this.ref.current.srcObject = this.props.stream
    // this.props.peer.on("stream", stream => {
    //   this.ref.current.srcObject = stream
    // })
  }

  render() {
    return (
      <StyledVideo playsInline autoPlay ref={this.ref} />
    )
  }
}

const StyledVideo = styled.video`
    height: 300px;
    width: 100%%;
    transform: rotateY(180deg);
    -webkit-transform:rotateY(180deg); /* Safari and Chrome */
    -moz-transform:rotateY(180deg); /* Firefox */
`;


export default Video