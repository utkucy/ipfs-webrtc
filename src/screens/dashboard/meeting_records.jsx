import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, toJS } from "mobx";
import styled from "styled-components";
import {
  Button,
  Typography,
  Spin,
  Table,
  Tag,
  Space,
  List,
  Avatar,
  Modal,
  Drawer,
  Layout,
  message,
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
} from "@ant-design/icons";
import { Cookies } from "react-cookie";
import moment from "moment";

import { MeetingRecord, Participant } from "../../models/meetingRecord";

const { Text, Title } = Typography;
const { Column, ColumnGroup } = Table;
const { Header, Footer, Sider, Content } = Layout;

@observer
class MeetingRecordsScreen extends React.Component {
  @observable meeting_records = [];
  @observable is_fetch_complete = false;
  @observable is_modal_visible = false;
  @observable record;

  constructor(props) {
    super(props);

    this.uid = this.props.user.uid;
  }

  @action.bound
  showParticipantModal(record, index) {
    this.is_modal_visible = true;
    this.record = record;
    // console.log(toJS(record));
  }

  @action.bound
  closeModal() {
    this.is_modal_visible = false;
  }

  @action.bound
  async componentDidMount() {
    try {
      let records = this.props.user.past_meetings;

      this.meeting_records = records.sort((a, b) => {
        return moment(b.createdAt).diff(a.createdAt);
      });
      //console.log(toJS(this.meeting_records))
    } catch (error) {
      console.log(error);
    }
    this.is_fetch_complete = true;
  }

  @action.bound
  async addContact(contact) {
    try {
      const contacts = this.props.user.contacts;
      if (!contacts.find((c) => c.uid === contact.uid)) {
        this.props.user.contacts.push(new Participant(contact));
        return message.success(`${contact.displayName} is added succesfully`);
      } else {
        return message.warning(
          `${contact.displayName} is already added to your contact list`
        );
      }
    } catch (error) {
      console.log("Error finding contact in the list ", error);
    }
  }

  render() {
    if (!this.is_fetch_complete) {
      return (
        <SpinnerContainer>
          <Spin tip="Loading..." size="large" />
        </SpinnerContainer>
      );
    }
    return (
      <RightContainer>
        <TitleContainer>
          <Text
            style={{ fontSize: 30, fontFamily: "Montserrat", color: "#043d75" }}
          >
            Meeting Records
          </Text>
        </TitleContainer>
        <TableContainer>
          <Table
            dataSource={this.meeting_records}
            style={{ width: "100%" }}
            pagination={{ pageSize: 10 }}
            bordered={true}
            onRow={(record, rowIndex) => {
              return {
                onClick: (event) => this.showParticipantModal(record, rowIndex),
              };
            }}
          >
            <Column
              title="Host"
              dataIndex="host_displayName"
              key="host_displayName"
            />
            {/* <Column title="Start" dataIndex="createdAt" key="createdAt" />
            <Column title="End" dataIndex="finishedAt" key="finishedAt" /> */}
            <Column title="Date" dataIndex="date" key="date" />
            <Column
              title="Participants"
              key="participants"
              render={(text, record) => (
                <Button type="link">See Participants</Button>
              )}
            />
          </Table>
          {this.record && (
            <Drawer
              title="Participant List"
              placement="right"
              closable={true}
              onClose={this.closeModal}
              destroyOnClose={true}
              visible={this.is_modal_visible}
              width="40%"
            >
              <List
                itemLayout="horizontal"
                dataSource={this.record.participant_list}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      this.uid !== item.uid && (
                        <a onClick={() => this.addContact(item)} key={item.uid}>
                          Add to Contacts
                        </a>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                      }
                      title={`${item.displayName} ${
                        item.uid === this.uid ? "(you)" : ""
                      }`}
                      description={item.email}
                    />
                  </List.Item>
                )}
              />
            </Drawer>
          )}
        </TableContainer>
      </RightContainer>
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
  flex: 1 1 auto;
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

const TableContainer = styled.div`
  width: 100%;
  display: flex;
  margin-top: 40px;
  margin-bottom: 40px;
  overflow: auto;
`;

export default MeetingRecordsScreen;
