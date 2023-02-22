import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed, reaction } from "mobx";
import styled from "styled-components";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Divider,
  Spin,
  notification,
  message,
  Avatar,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Cookies } from "react-cookie";

import { store } from "store";
import { User } from "models/user";
import { Settings } from "models/settings";

import MetamaskLogo from "../../assets/images/metamask.png";
import { isElectron } from "utils";

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};
const { Text, Link, Title } = Typography;

const is_electron = isElectron();

@observer
class LoginScreen extends React.Component {
  @observable email;
  @observable password;
  @observable emailError;
  @observable passwordError;
  @observable hasAccount;
  @observable isChecked = true;

  async componentDidMount() {
    const cookies = new Cookies();
    const isWalletAccountChanged = cookies.get("accountChanged");
    if (isWalletAccountChanged === "true") {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then(async (addressArray) => {
          // Return the address of the wallet
          const address = addressArray[0];

          const user = await store.userStore.getUser(address);
          if (user && cookies.get("_id") === user._id) {
            this.props.changeUser(user);

            const cookies = new Cookies();
            cookies.set("displayName", user.displayName);
            cookies.set("_id", user._id);
            cookies.set("rememberMe", this.isChecked);
            cookies.remove("accountChanged");
            this.props.history.push("/dashboard");
          }
        });
    }

    if (
      cookies.get("_id") &&
      cookies.get("displayName") &&
      cookies.get("rememberMe") === "true"
    ) {
      this.props.history.push("/dashboard");
    }
  }

  constructor(props) {
    super(props);
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
  setHasAccount(hasAccount) {
    this.hasAccount = hasAccount;
  }

  @action.bound
  clearErrors() {
    this.emailError = "";
    this.passwordError = "";
  }

  @computed
  get isElectron() {
    return !!is_electron;
  }

  @action.bound
  async handleLogin() {
    this.clearErrors();

    try {
      const user = await store.userStore.login(this.email, this.password);
      this.props.changeUser(user);

      const cookies = new Cookies();
      cookies.set("displayName", user.displayName);
      cookies.set("_id", user._id);
      cookies.set("rememberMe", this.isChecked);
      this.props.history.push("/dashboard");
    } catch (err) {
      message.error("User Not Found!");
    }
  }

  @action.bound
  rememberMe(e) {
    this.isChecked = e.target.checked;
  }

  @action.bound
  forgotPwd() {
    this.props.history.push("/forgot_password");
  }

  @action.bound
  register() {
    this.props.history.push("/register");
  }

  @action.bound
  connectToWallet() {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then(async (addressArray) => {
          // Return the address of the wallet
          const address = addressArray[0];

          let user = await store.userStore.getUser(address);
          if (!user) {
            const _user = new User({
              _id: address,
              displayName: `Wallet User: ${address}`,
              email: "Wallet User",
              password: address,
              settings: new Settings({
                confirm_leave_meeting: true,
                copy_invite_link: true,
                show_meeting_duration: true,
                turn_of_media_devices: true,
              }),
            });

            try {
              const hash = await store.userStore.register(_user);
              if (!hash)
                return notification.error({
                  message: `Notification`,
                  description: "Register failed",
                  placement: "topRight",
                  duration: 2.5,
                  style: { borderRadius: 8 },
                });
              user = _user;
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
          }

          this.props.changeUser(user);

          const cookies = new Cookies();
          cookies.set("displayName", user.displayName);
          cookies.set("_id", user._id);
          cookies.set("rememberMe", this.isChecked);
          this.props.history.push("/dashboard");
        });
    } else {
      notification.error({
        message: `Notification`,
        description: "Rinstall metamask extension!!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
    }
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
          layout="vertical"
          name="normal_login"
          className="login-form mobile:w-full w-96"
          initialValues={{
            remember: true,
          }}
        >
          <Form.Item style={{ marginBottom: 0 }}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your Email!" }]}
              label="Email"
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                // placeholder="Email"
                autoFocus
                // required
                value={this.email}
                onChange={(e) => this.setEmail(e.target.value)}
                className="rounded-lg hover:border-purple-500"
              />
              <WarningContainer>
                <Text type="danger" className="errorMsg">
                  {this.emailError}
                </Text>
              </WarningContainer>
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input your Password!" },
              ]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                // placeholder="Password"
                // required
                value={this.password}
                onChange={(e) => this.setPassword(e.target.value)}
                className="rounded-lg hover:border-purple-500"
              />
              <WarningContainer>
                <Text type="danger" className="errorMsg">
                  {this.passwordError}
                </Text>
              </WarningContainer>
            </Form.Item>

            <Form.Item
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <CheckedContainer>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <StyledCheckbox onChange={this.rememberMe}>
                    Keep Me Signed In
                  </StyledCheckbox>
                </Form.Item>
                {/* <Button
                  type="link"
                  onClick={this.forgotPwd}
                  style={{ padding: 0 }}
                >
                  Forgot Password?
                </Button> */}
              </CheckedContainer>
            </Form.Item>

            <Form.Item style={{ marginBottom: 10 }}>
              <ButtonContainer>
                <div
                  // type="primary"
                  onClick={this.handleLogin}
                  className="w-full mb-8 rounded-lg bg-purple-900 hover:bg-purple-800 py-2 flex justify-center items-center text-white font-bold cursor-pointer "
                >
                  Login
                </div>
                <div className="flex flex-wrap gap-2 justify-between items-center w-full">
                  <Text className="text-center text-purple-900">
                    Don't have an account?
                  </Text>
                  <Button
                    type="link"
                    onClick={this.register}
                    className="text-center text-purple-900 hover:text-purple-300 "
                  >
                    Register Now!
                  </Button>
                </div>
              </ButtonContainer>
            </Form.Item>
          </Form.Item>

          {!this.isElectron && !store.isMobile && (
            <>
              <ORContainer>
                <Divider>OR</Divider>
              </ORContainer>
              <div
                className="w-full mb-8 rounded-lg bg-white py-2 flex justify-center items-center text-purple-500 hover:text-purple-300 border border-purple-500 hover:border-purple-300 font-bold cursor-pointer transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                transition-duration: 150ms; "
                onClick={this.connectToWallet}
              >
                <Avatar
                  style={{ marginRight: 8 }}
                  size={16}
                  src={MetamaskLogo}
                />
                Connect with Metamask
              </div>
            </>
          )}
        </Form>
      </div>
    );
  }
}

const DivideContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-direction: row;
`;

const RightContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  margin: 0;
  position: absolute;
  top: 50%;
  margin-left: 150px;
`;

const CheckedContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  flex-direction: row;
`;
const ORContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: row;
  font-family: "Montserrat";
`;

const SpinnerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const WarningContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: rgb(168 85 247);
    border-color: rgb(168 85 247);

    :hover {
      border-color: rgb(168 85 247) !important;
    }
  }

  :hover {
    border-color: rgb(168 85 247) !important;
  }
`;

export default LoginScreen;
