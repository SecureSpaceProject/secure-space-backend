export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}

export enum RoomMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  USER = "USER",
  DEFAULT = "DEFAULT",
}

export enum SensorType {
  MOTION = "MOTION",
  OPEN = "OPEN",
}

export enum SensorState {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum AlertStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  READ = "READ",
  FAILED = "FAILED",
}

export enum ActivityAction {
  // room
  CREATE_ROOM = "CREATE_ROOM",
  UPDATE_ROOM = "UPDATE_ROOM",
  ARM_ROOM = "ARM_ROOM",
  DISARM_ROOM = "DISARM_ROOM",

  // sensors
  ADD_SENSOR = "ADD_SENSOR",
  UPDATE_SENSOR = "UPDATE_SENSOR",
  REMOVE_SENSOR = "REMOVE_SENSOR",

  // members
  ADD_MEMBER = "ADD_MEMBER",
  REMOVE_MEMBER = "REMOVE_MEMBER",
  UPDATE_MEMBER_ROLE = "UPDATE_MEMBER_ROLE",

  // alerts
  CREATE_ALERT = "CREATE_ALERT",
  CLOSE_ALERT = "CLOSE_ALERT",
  DISABLE_ALERT = "DISABLE_ALERT",
}

export enum ActivityTargetType {
  ROOM = "ROOM",
  SENSOR = "SENSOR",
  USER = "USER",
  ROOM_MEMBER = "ROOM_MEMBER",
  ALERT = "ALERT",
}
