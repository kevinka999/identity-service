import { SignupController } from './usecases/auth/signup/signup.controller';
import { LoginController } from './usecases/auth/login/login.controller';
import { RefreshController } from './usecases/auth/refresh/refresh.controller';
import { LogoutController } from './usecases/auth/logout/logout.controller';

export default [
  SignupController,
  LoginController,
  RefreshController,
  LogoutController,
];
