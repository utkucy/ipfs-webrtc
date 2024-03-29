import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed } from "mobx";
import styled from "styled-components";
import { Modal, Input, Row, Col, Form, message, Drawer } from "antd";

import { User } from "../../../../models/user";
import { store } from "store";

@observer
class JoinRoom extends React.Component {
  @observable room_id = null;
  @observable password = null;
  @observable user = this.props.user;
  @observable isPending = false;

  @action.bound
  async onOk() {
    // this.props.changeModalVisibility()
    // this.props.history.push(`/room/${this.room_id}/${this.password}`)
    this.isPending = true;

    if (this.room_id !== null && this.password !== null)
      try {
        const room = await store.userStore.getRoom(this.room_id);
        if (room) {
          if (room.room_password === this.password) {
            if (
              room.current_participants &&
              room.current_participants.length === 4
            ) {
              this.isPending = false;
              return message.warning("Room is full");
            }

            room.current_participant_list.push({
              uid: this.user._id,
              displayName: this.user.displayName,
              email: this.user.email,
              socketID: "",
            });

            room.participant_list.push({
              uid: this.user._id,
              displayName: this.user.displayName,
              email: this.user.email,
              socketID: "",
            });
            await store.userStore.createMeeting(room);

            this.props.changeModalVisibility();
            this.props.history.push(`/room/${this.room_id}/${this.password}`);
          } else {
            this.isPending = false;
            return message.error("Wrong password!");
          }
        } else {
          this.isPending = false;
          return message.error("We could not find any Room with given Room ID");
        }
      } catch (error) {
        this.isPending = false;
        console.log(error);
      }
    else {
      this.isPending = false;
      return message.warning("Please enter Room ID and Password");
    }
  }

  @action.bound
  handleCancel() {
    this.props.changeModalVisibility();
  }

  @action.bound
  onRoomIdChange(input) {
    this.room_id = input.target.value;
    //console.log(this.room_id);
  }

  @action.bound
  onPasswordChange(input) {
    this.password = input.target.value;
  }

  render() {
    return (
      <>
        {store.isMobile ? (
          <Drawer
            title="Room Information"
            visible={this.props.isModalVisible}
            onOk={this.onOk}
            onClose={this.handleCancel}
            destroyOnClose={true}
            width={"100%"}
          >
            <div className="w-full h-full flex flex-col mt-5">
              <Form
                layout="vertical"
                className="w-full flex flex-col justify-center"
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Room ID" required={true}>
                      <Input
                        // value={this.newProduct.name}
                        onChange={this.onRoomIdChange}
                        style={{ fontSize: 16 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Password" required={true}>
                      <Input
                        // value={this.newProduct.description}
                        onChange={this.onPasswordChange}
                        style={{ fontSize: 16 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <div
                onClick={this.onOk}
                className={`flex cursor-pointer justify-center items-center mt-5 w-full p-4 rounded bg-purple-700 text-purple-50 ${
                  this.isPending ? "bg-purple-500" : ""
                } `}
              >
                {this.isPending ? "Joining..." : "Join"}
              </div>
            </div>
          </Drawer>
        ) : (
          <Modal
            title="Room Information"
            centered
            okText="Join"
            visible={this.props.isModalVisible}
            onOk={this.onOk}
            onCancel={this.handleCancel}
            // style={{ height: '200px' }}
            okButtonProps={{
              style: { backgroundColor: "rgb(88 28 135)", border: "none" },
              loading: this.isPending,
            }}
            bodyStyle={{ paddingTop: 40, paddingBottom: 40, height: 220 }}
            destroyOnClose={true}
          >
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Room ID" required={true}>
                    <Input
                      // value={this.newProduct.name}
                      onChange={this.onRoomIdChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Password" required={true}>
                    <Input
                      // value={this.newProduct.description}
                      onChange={this.onPasswordChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>
        )}
      </>
    );
  }
}

export default JoinRoom;
