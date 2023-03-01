import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed } from "mobx";
import styled from "styled-components";
import {
  Form,
  Input,
  Tooltip,
  Cascader,
  Select,
  Row,
  Col,
  Checkbox,
  Button,
  AutoComplete,
  Typography,
  notification,
  Divider,
  Space,
} from "antd";
import {
  QuestionCircleOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
} from "@ant-design/icons";

import { store } from "store";
import { User } from "models/user";
import { v4 as uuidv4, v4 } from "uuid";
import { Settings } from "models/settings";

const { Text, Link, Title } = Typography;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

@observer
class RegisterScreen extends React.Component {
  @observable name;
  @observable surname;
  @observable email;
  @observable password;
  @observable verifyPassword;
  @observable emailError;
  @observable passwordError;
  @observable hasAccount;

  constructor(props) {
    super(props);
  }

  @action.bound
  setName(name) {
    this.name = name;
  }

  @action.bound
  setSurname(surname) {
    this.surname = surname;
  }

  @action.bound
  setEmail(email) {
    this.email = email;
  }

  @action.bound
  setPassword(password) {
    this.password = password;
  }

  @action.bound
  setVerifyPassword(verifyPassword) {
    this.verifyPassword = verifyPassword;
  }

  @action.bound
  setHasAccount(hasAccount) {
    this.hasAccount = hasAccount;
  }

  @action.bound
  clearInputs() {
    this.email = "";
    this.password = "";
  }

  @action.bound
  clearErrors() {
    this.emailError = "";
    this.passwordError = "";
  }

  @action.bound
  async handleSignup() {
    this.clearErrors();
    let user_id;
    try {
      if (this.verifyPassword === this.password && this.name && this.surname) {
        if (this.password.length < 6) {
          notification.warning({
            message: `Weak Password`,
            description: "Password cannot be less than 6 characters.",
            placement: "topRight",
            duration: 2.5,
            style: { borderRadius: 8 },
          });
          return;
        }

        const user = new User({
          _id: v4(),
          displayName: `${this.name + " " + this.surname}`,
          email: this.email,
          password: this.password,
          settings: new Settings({
            confirm_leave_meeting: true,
            copy_invite_link: true,
            show_meeting_duration: true,
            turn_of_media_devices: true,
          }),
        });
        try {
          const hash = await store.userStore.register(user);
          if (!hash)
            return notification.error({
              message: `Notification`,
              description: "Register failed",
              placement: "topRight",
              duration: 2.5,
              style: { borderRadius: 8 },
            });
        } catch (error) {
          console.error("Error adding document: ", error);
        }

        notification.success({
          message: `Notification`,
          description: "Succesfully registered",
          placement: "topRight",
          duration: 2.5,
          style: { borderRadius: 8 },
        });
        this.props.history.push("/");
      } else {
        this.clearErrors();
      }
    } catch (err) {
      this.handleErrorMessage(err.code);
    }
  }

  @action.bound
  handleErrorMessage(errorMessage) {
    if (errorMessage == "auth/email-already-in-use") {
      notification.error({
        message: `Notification`,
        description: "This email already in use!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
    } else if (errorMessage == "auth/invalid-email") {
      notification.error({
        message: `Notification`,
        description: "This email is invalid!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
    } else if (errorMessage == "auth/weak-password") {
      notification.error({
        message: `Notification`,
        description: "This password is weak!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
    }

    return;
  }

  @action.bound
  goBack() {
    this.props.history.push("/");
  }

  render() {
    return (
      <div
        style={{ background: "rgb(249,250,251)" }}
        className="flex flex-col justify-center items-center w-full h-full mobile:px-6 "
      >
        <div className="text-center mb-4 text-purple-900 font-custom font-bold text-3xl ">
          Web3RTC
        </div>
        <Form
          // {...formItemLayout}
          name="register"
          layout="vertical"
          className="mobile:w-full w-96"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              {
                required: true,
                message: "Please input your Name!",
              },
            ]}
          >
            <Input
              value={this.name}
              onChange={(e) => this.setName(e.target.value)}
              style={{ borderRadius: 8, fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item
            name="surname"
            label="Surname"
            rules={[
              {
                required: true,
                message: "Please input your Surname!",
              },
            ]}
          >
            <Input
              value={this.surname}
              onChange={(e) => this.setSurname(e.target.value)}
              style={{ borderRadius: 8, fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-mail"
            style={{ borderRadius: 8 }}
            rules={[
              {
                type: "email",
                message: "The input is not valid E-mail!",
              },
              {
                required: true,
                message: "Please input your E-mail!",
              },
            ]}
          >
            <Input
              value={this.email}
              onChange={(e) => this.setEmail(e.target.value)}
              style={{ borderRadius: 8, fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            style={{ borderRadius: 8 }}
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
            hasFeedback
          >
            <Input
              type="password"
              value={this.password}
              onChange={(e) => this.setPassword(e.target.value)}
              style={{ borderRadius: 8, fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            style={{ borderRadius: 8 }}
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    "The two passwords that you entered do not match!"
                  );
                },
              }),
            ]}
          >
            <Input
              type="password"
              value={this.verifyPassword}
              onChange={(e) => this.setVerifyPassword(e.target.value)}
              style={{ borderRadius: 8, fontSize: 16 }}
            />
          </Form.Item>

          <Form.Item>
            <button
              // type="primary"
              onClick={this.handleSignup}
              className="w-full mb-8 mt-3 rounded-lg bg-purple-900 hover:bg-purple-800 py-2 flex justify-center items-center text-white font-bold cursor-pointer "
              htmlType="submit"
            >
              Register
            </button>

            <Button
              type="link"
              onClick={this.goBack}
              className="text-center text-purple-900 w-full mb-4 rounded-lg hover:text-purple-300"
            >
              Back to Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
`;

export default RegisterScreen;
