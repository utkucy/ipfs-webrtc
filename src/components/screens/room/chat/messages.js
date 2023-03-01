import React, { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { Card, Input } from "antd";
import { observer, PropTypes } from "mobx-react";
import ScrollToBottom from "react-scroll-to-bottom";
import moment from "moment";
import { store } from "store";
import { action, observable } from "mobx";
import { toString } from "uint8arrays/to-string";

@observer
export default class Messages extends React.Component {
  @observable messages = [];
  @observable message = "";

  TEXT_CODE = "@@1234@@";
  TOPIC = `chatRoom-${this.props.room_id}`;
  @observable messagesEndRef = React.createRef(null);

  @action.bound
  scrollToBottom() {
    this.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async componentDidMount() {
    await store.databaseStore.ipfs.pubsub.subscribe(
      this.TOPIC,
      this.onMessageHandler,
      this.onNewPeerHandler
    );
  }

  componentWillUnmount() {
    store.databaseStore.ipfs.pubsub.unsubscribe(this.TOPIC);
  }

  @action.bound
  binArrayToJson(binArray) {
    var str = "";
    for (var i = 0; i < binArray.length; i++) {
      str += String.fromCharCode(parseInt(binArray[i]));
    }
    return JSON.parse(str);
  }

  @action.bound
  onMessageHandler(topic, data) {
    // console.log("new message");
    // console.log("topic", topic);

    // console.log("data", data);
    // console.log("type", topic.data instanceof Uint8Array);
    try {
      if (topic.data instanceof Uint8Array) {
        const array = toString(Uint8Array.from(topic.data)).split(
          this.TEXT_CODE
        );

        this.messages.push({
          text: array[0],
          userId: array[1],
          userName: array[2],
        });
      } else {
        const array = topic.data.split(this.TEXT_CODE);
        this.messages.push({
          text: array[0],
          userId: array[1],
          userName: array[2],
        });
      }
    } catch (error) {
      console.log("error", error);
    }

    this.scrollToBottom();
  }

  @action.bound
  onNewPeerHandler(topic, peer) {
    // console.log("new peer joined", topic, peer);
  }

  @action.bound
  handleSend(e) {
    let text = "";
    text = text.concat(this.message);
    text = text.concat(this.TEXT_CODE);
    text = text.concat(this.props.user._id);
    text = text.concat(this.TEXT_CODE);
    text = text.concat(this.props.user.displayName);

    store.databaseStore.ipfs.pubsub.publish(this.TOPIC, text);
    this.message = "";
  }

  @action.bound
  onMessageChange(e) {
    this.message = e;
  }

  render() {
    return (
      <Container>
        <CardContainer>
          {this.messages.length > 0 &&
            this.messages.map((message, index) => (
              <MessageContainer
                key={index}
                alignRight={
                  message.userId === this.props.user._id ? true : false
                }
              >
                <div
                  style={{
                    width: "90%",
                  }}
                  className={`flex flex-col rounded text-purple-100 px-4 py-2 bg-slate-600  `}
                >
                  <p
                    className="break-words w-full h-auto"
                    style={{ fontSize: 16 }}
                  >
                    {message.text}
                  </p>
                  <div
                    style={{ fontSize: 12 }}
                    className="text-purple-50 font-semibold break-words"
                  >
                    {message.userName +
                      "\t" +
                      moment(message.createdAt).format("H:mm")}
                  </div>
                  <div ref={this.messagesEndRef} />
                </div>
              </MessageContainer>
            ))}
        </CardContainer>
        <div ref={this.messagesEndRef} />

        <Input
          value={this.message}
          onPressEnter={(e) => this.handleSend(e)}
          placeholder="Enter your message"
          onChange={(e) => this.onMessageChange(e.target.value)}
          style={{ height: 84 }}
          className="w-full bg-slate-600 border-none hover:border-none focus:border-none rounded-none text-white"
        />
      </Container>
    );
  }
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const MessageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: ${(props) => (props.alignRight ? "flex-end" : "flex-start")};
  margin-top: 5px;
  margin-bottom: 5px;
`;
const CardContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  margin-top: 5px;
  padding: 12px;
`;
