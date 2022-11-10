import _ from 'axios';

declare module 'axios' {
  export interface Cancel {
    readonly __cancel: boolean;
  }
}
