import React, { useState } from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import { Drawer, Button } from "antd";
import styled from "styled-components";
import Messages from "../../../../components/screens/room/chat/messages.js";

@observer
class DrawerComponent extends React.Component {
  render() {
    return (
      <Drawer
        title="Chat"
        placement="right"
        closable={false}
        onClose={this.props.changeModalVisibility}
        visible={this.props.showDrawer}
        mask={false}
        width="25%"
      >
        <Messages room_id={this.props.room_id} user={this.props.user} />
        <div></div>
      </Drawer>
    );
  }
}

export default DrawerComponent;
