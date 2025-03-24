import { StaticImageData } from "next/image";
import { ComponentType, ForwardRefExoticComponent, ReactNode, RefAttributes, SVGProps } from "react";

export interface NavItemProps {
  icon: React.ElementType;
  text: string;
  href: string;
  onClick: () => void;
  setCurrentTitle: (title: string) => void;
}


export interface SidebarItem {
  path: string;
  titleItem: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>> | ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;
  activeTitle?: string | string[];
  sublinks?: SidebarItem[];
}


export type userLoginType = {
  email: string;
  password: string;
};


export type userRegisterType = {
  email: string;
  name: string;
  password: string;
  passwordConfirm?: string;
};


export type credentialsType = {
  access_token: string;
  refresh_token: string;
};


export type patchProfileType = {
  country_id?: number;
  gender_id?: number;
  preferences_id?: string[] | number[];
  phone?: string;
  outfits_ids?: string[];
  avatar_url?: string;
  name?: string;
};


export type newPasswordType = {
  password: string;
  confirm: string;
};


export type userLoginResponseType = {
  credentials: {
    access_token: string;
    refresh_token: string;
  };
  user: string;
};


export type countryType = {
  id?: number;
  name?: string;
  name_es?: string;
  name_en?: string;
  iso2?: string;
  iso3?: string;
  phone_code?: string;
};


export type userType = {
  id?: string;
  email: string;
  name: string;
  profile?: {
    id: string;
    language: string;
    country: countryType;
    gender: string;
    preferences: string[];
    phone: string;
    avatar_url?: string;
  };
  password?: string;
};

