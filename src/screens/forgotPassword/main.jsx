import React from "react";
import { observer } from "mobx-react";
import { action, observable, computed } from "mobx";
import styled from "styled-components";
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  notification,
  TouchableOpacity,
} from "antd";
import { Cookies } from "react-cookie";
import {
  UserOutlined,
  QuestionCircleOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
} from "@ant-design/icons";

import { User } from "../../models/user";

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};
const { Text, Link, Title } = Typography;

@observer
class ForgotPasswordScreen extends React.Component {
  @observable email;
  @observable emailAddress;

  constructor(props) {
    super(props);
  }

  @action.bound
  setEmail(email) {
    this.email = email;
  }

  @action.bound
  async forgotPassword() {
    try {
      this.emailAddress = this.email;
      const success = await this.auth.sendPasswordResetEmail(this.emailAddress);

      this.handleSendMessage();

      this.goBack();
    } catch (error) {
      this.handleErrorMessage(error);
      console.log(error);
    }
  }

  @action.bound
  handleSendMessage() {
    notification.success({
      message: `Notification`,
      description: "Reset email sent.",
      placement: "topRight",
      duration: 2.5,
      style: { borderRadius: 8 },
    });
  }

  @action.bound
  handleErrorMessage(error) {
    if (!this.emailAddress) {
      notification.warning({
        message: `Notification`,
        description: "Email field cannot be empty!",
        placement: "topRight",
        duration: 2.5,
        style: { borderRadius: 8 },
      });
      return;
    } else if (
      (error.message =
        "[auth/invalid-email] The email address is badly formatted.")
    ) {
      notification.warning({
        message: `Notification`,
        description: "The email address is badly formatted",
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
      <Container>
        <Form
          name="normal_login"
          className="login-form"
          initialValues={{
            remember: true,
          }}
        >
          {/* <Form.Item>
            <ImageView>
              <img
                style={{
                  width: 250,
                  height: 200,
                  marginTop: 32,
                  marginLeft: 112,
                }}
                src={image}
              />
            </ImageView>
          </Form.Item> */}

          <Form.Item>
            <Text style={{ fontSize: 20 }}>Forgot your password?</Text>
          </Form.Item>

          <Form.Item>
            <Text>
              Don't worry. Resetting your password is easy, just tell us your
              email address.
            </Text>
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your Email!" }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Email"
              autoFocus
              required
              value={this.email}
              onChange={(e) => this.setEmail(e.target.value)}
              style={{ borderRadius: 8, width: "100%", marginBottom: 30 }}
            />
            <WarningContainer>
              <Text type="danger" className="errorMsg">
                {this.emailError}
              </Text>
            </WarningContainer>
          </Form.Item>

          <Form.Item>
            <ButtonContainer>
              <Button
                type="primary"
                onClick={this.forgotPassword}
                style={{ width: "100%", marginBottom: 20, borderRadius: 8 }}
              >
                Send
              </Button>

              <Button
                type="link"
                onClick={this.goBack}
                style={{ width: "100%", marginBottom: 30, borderRadius: 8 }}
              >
                Back to Login
              </Button>
            </ButtonContainer>
          </Form.Item>
        </Form>
      </Container>
    );
  }
}
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  flex-direction: column;
`;

const ImageView = styled.div`
  width: 100%;
  align-items: center;
  /* bottom: 0px; */
  top: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const RegisterContainer = styled.div`
  display: flex;
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
export default ForgotPasswordScreen;
