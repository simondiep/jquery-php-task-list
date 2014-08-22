
CREATE TABLE 'task_list' (
  'id' int(11) NOT NULL,
  'task_list_string' longtext NOT NULL,
  'task_order_string' longtext NOT NULL,
  'user_id' int(11) NOT NULL,
  PRIMARY KEY ('id'),
  KEY 'user_id' ('user_id'),
  CONSTRAINT 'user_id' FOREIGN KEY ('user_id') REFERENCES 'users' ('id') ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;