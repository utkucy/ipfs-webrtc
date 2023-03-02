import React, { useState } from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import { Drawer, Button } from "antd";
import styled from "styled-components";
import Messages from "../../../../components/screens/room/chat/messages.js";
import { store } from "store/index.ts";
import { CloseOutlined } from "@ant-design/icons";

@observer
class DrawerComponent extends React.Component {
  render() {
    return (
      <Drawer
        title={
          <div className="w-full h-full flex items-center justify-between">
            Chat
            <CloseOutlined
              className="cursor-pointer"
              onClick={this.props.changeModalVisibility}
            />
          </div>
        }
        placement="right"
        closable={false}
        onClose={this.props.changeModalVisibility}
        visible={this.props.showDrawer}
        mask={false}
        width={store.isMobile ? "100%" : "450px"}
        className="drawer-style"
      >
        <Messages room_id={this.props.room_id} user={this.props.user} />
        <div></div>
      </Drawer>
    );
  }
}

export default DrawerComponent;
