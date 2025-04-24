export interface ICreateUser {
  username: string;

  password?: string;

  mobile?: string;

  isVerifiedMobile?: boolean;
}

export interface ICreateUserStudent {
  username: string;
}
export interface ICreateUserCoach {
  username: string;
}

export interface IPagination {
  take?: number;
  page?: number;
}

export interface ISearchUser extends IPagination {
  query: string;
}

export interface IUpdateUser {
  userId: number;
  username?: string;
  mobile?: string;
  lastPasswordChange?: Date;
  isVerifiedMobile?: boolean;
  password?: string;
}

export interface IGetUserByArgs {
  mobile?: string;
  username?: string;
}

export interface IUsersFilter extends IPagination {
  username?: string;
  mobile?: string;
  lastPasswordChange?: Date;
  includeRoles?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'username' | 'createdAt' | 'mobile' | 'updateAt';
  sortDirection?: 'asc' | 'desc';
}

export interface IVerifyMobile {
  mobile: string;
}
