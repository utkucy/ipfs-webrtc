import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled from "styled-components";
import {
  Button,
  Typography,
  Spin,
  List,
  Avatar,
  message,
  Empty,
  Popconfirm,
} from "antd";
import {
  HomeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  VideoCameraOutlined,
  PlusSquareOutlined,
  MessageOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import { Cookies } from "react-cookie";

import { User } from "../../models/user";

import UserImage from "../../assets/images/user.png";
import { store } from "store";
import { antLoaderIcon } from "App";

const { Text, Title } = Typography;

@observer
class ContactsScreen extends React.Component {
  @observable contacts = [];
  @observable is_fetch_complete = false;

  async componentDidMount() {
    await this.fetchContactList();
    this.is_fetch_complete = true;
  }

  @action.bound
  async fetchContactList() {
    try {
      this.contacts = this.props.user.contacts;
    } catch (error) {
      console.log("Error while getting contacts", error);
    }
  }

  @action.bound
  async deleteContact(contact) {
    try {
      this.props.user.contacts = this.props.user.contacts.filter(
        (c) => c.uid !== contact.uid
      );
      await store.userStore.register(this.props.user);
      this.contacts = this.props.user.contacts;
    } catch (error) {
      console.log("Error while deleting contact fields ", error);
    }
  }

  render() {
    if (!this.is_fetch_complete) {
      return (
        <SpinnerContainer style={{ color: "rgb(109 40 217)" }}>
          <Spin
            style={{ color: "rgb(109 40 217)" }}
            tip="Loading..."
            size="large"
            indicator={antLoaderIcon}
          />
        </SpinnerContainer>
      );
    }
    return (
      <div className="w-full flex flex-col px-10 mobile:p-4 ">
        <div className="w-full flex justify-start mt-32 mobile:mt-8">
          <Text
            style={{ fontSize: 30, fontFamily: "Montserrat" }}
            className="text-purple-900"
          >
            Your Contact List
          </Text>
        </div>
        {this.contacts.length ? (
          <ListContainer>
            <List
              style={{ width: "100%" }}
              itemLayout="horizontal"
              dataSource={this.contacts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      okType="danger"
                      placement="left"
                      title="Are you sure to delete this contact?"
                      onConfirm={() => this.deleteContact(item)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="link">
                        <UserDeleteOutlined style={{ color: "#ff4d4f" }} />
                      </Button>
                    </Popconfirm>,
                    // <a style={{ color: '#ff4d4f' }} onClick={() => this.deleteContact(item)} key={item.uid}>
                    //   Delete
                    // </a>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={UserImage} />}
                    title={item.displayName}
                    description={item.email}
                  />
                </List.Item>
              )}
            />
          </ListContainer>
        ) : (
          <EmptyContainer>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Contact List is Empty"
            />
          </EmptyContainer>
        )}
      </div>
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

const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  /* background-color:yellow; */
  /* align-items: center; */
  padding-left: 60px;
  padding-right: 60px;
`;

const TitleContainer = styled.div`
  width: 100%;
  /* height: 64px; */
  display: flex;
  justify-content: flex-start;
  /* align-items: center; */
  margin-top: 140px;
`;

const ListContainer = styled.div`
  width: 100%;
  display: flex;
  margin-top: 40px;
  margin-bottom: 40px;
  overflow: auto;
`;
const EmptyContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  margin-top: 100px;
  justify-content: center;
`;

export default ContactsScreen;
