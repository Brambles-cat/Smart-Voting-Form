CREATE TABLE "user" (
	id TEXT PRIMARY KEY,
	last_active DATE NOT NULL,
	last_ballot_update DATE
);

CREATE TABLE video_metadata (
	id TEXT,
	thumbnail TEXT,
	title TEXT NOT NULL,
	uploader TEXT NOT NULL,
	uploader_id TEXT NOT NULL,
	upload_date DATE,
	duration INT,
	platform TEXT NOT NULL,
	whitelisted BOOL NOT NULL DEFAULT FALSE,
	PRIMARY KEY (id, platform)
);

CREATE TABLE ballot_item (
	user_id TEXT NOT NULL,
	video_id TEXT NOT NULL,
	platform TEXT NOT NULL,
	index INT NOT NULL,
	PRIMARY KEY (user_id, index),
	FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
	FOREIGN KEY (video_id, platform) REFERENCES video_metadata(id, platform) ON DELETE CASCADE
);

CREATE TABLE playlist (
	id TEXT PRIMARY KEY,
	owner_id TEXT,
	thumbnail TEXT,
	name TEXT,
	description TEXT,
	last_accessed DATE
);

CREATE TABLE playlist_item (
	id SERIAL PRIMARY KEY,
	playlist_id TEXT NOT NULL,
	video_id TEXT NOT NULL,
	platform TEXT NOT NULL,
	FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE,
	FOREIGN KEY (video_id, platform) REFERENCES video_metadata(id, platform) ON DELETE CASCADE
);

CREATE TABLE label_config (
	name TEXT NOT NULL,
	type TEXT NOT NULL,
	details TEXT NOT NULL,
	trigger TEXT PRIMARY KEY
);

CREATE TABLE manual_label (
	video_id TEXT,
	platform TEXT,
	label TEXT,
	reason TEXT,
	PRIMARY KEY (video_id, platform, label, reason)
);
