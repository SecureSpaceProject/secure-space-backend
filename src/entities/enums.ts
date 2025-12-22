export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
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
  ARM_ROOM = "ARM_ROOM",
  DISARM_ROOM = "DISARM_ROOM",
  ADD_SENSOR = "ADD_SENSOR",
  UPDATE_SENSOR = "UPDATE_SENSOR",
  REMOVE_SENSOR = "REMOVE_SENSOR",
  SENSOR_TRIGGERED = "SENSOR_TRIGGERED",
  CREATE_ALERT = "CREATE_ALERT",
  CLOSE_ALERT = "CLOSE_ALERT",
  ADD_MEMBER = "ADD_MEMBER",
  REMOVE_MEMBER = "REMOVE_MEMBER",
}

export enum ActivityTargetType {
  ROOM = "ROOM",
  SENSOR = "SENSOR",
  SENSOR_EVENT = "SENSOR_EVENT",
  ALERT = "ALERT",
  USER = "USER",
  ROOM_MEMBER = "ROOM_MEMBER",
  NOTIFICATION = "NOTIFICATION",
}
