import { SignupUsecase } from './usecases/auth/signup/signup.usecase';
import { LoginUsecase } from './usecases/auth/login/login.usecase';
import { RefreshUsecase } from './usecases/auth/refresh/refresh.usecase';
import { LogoutUsecase } from './usecases/auth/logout/logout.usecase';

export default [
  SignupUsecase,
  LoginUsecase,
  RefreshUsecase,
  LogoutUsecase,
];
