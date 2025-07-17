CREATE TABLE "user" (
	id TEXT PRIMARY KEY,
	ballot_id TEXT,
	last_active DATE NOT NULL,
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
	playlist_id TEXT,
	video_id TEXT NOT NULL,
	platform TEXT NOT NULL,
	playlist_index INT NOT NULL,
	PRIMARY KEY (playlist_id, playlist_index),
	FOREIGN KEY (playlist_id) REFERENCES playlist(playlist_id) ON DELETE CASCADE,
	FOREIGN KEY (video_id, platform) REFERENCES video_metadata(video_id, platform) ON DELETE CASCADE
);

CREATE TABLE video_metadata (
	id TEXT,
	thumbnail_path TEXT,
	title TEXT NOT NULL,
	uploader TEXT NOT NULL,
	uploader_id TEXT NOT NULL,
	upload_date DATE,
	duration INT,
	platform TEXT NOT NULL,
	whitelisted BOOL NOT NULL DEFAULT FALSE,
	PRIMARY KEY (video_id, platform)
);

CREATE TABLE label_config (
	name TEXT NOT NULL,
	type TEXT NOT NULL,
	details TEXT NOT NULL,
	trigger TEXT PRIMARY KEY
)

CREATE TABLE manual_label (
	video_id TEXT,
	platform TEXT,
	label TEXT,
	reason TEXT,
	PRIMARY KEY (video_id, platform, label, reason)
);
