CREATE EXTENSION citext WITH SCHEMA app;

create table app.m_user (
	user_id uuid not null default gen_random_uuid(),
	is_admin bool not null default false, 
	first_name varchar(100) not null,
	last_name varchar(100) null,
	email_id varchar(254) not null,
	pub_key text null,
	phone varchar(15) null,
	pass varchar(256) null,
	force_reset_pass bool not null default false,
	pass_reset_token uuid null,
	pass_reset_token_expiry timestamp null,
	last_login_ip inet null,
	pub_key_sha_256 text,
	encypted_data text,
	secret_key text,
	secret_iv text,
	login_disabled_by uuid null,
	login_disabled_on timestamp null,
	last_login_on timestamp null,
	updated_by uuid null,
	updated_on timestamp null,
	deleted_by uuid null,
	deleted_on timestamp null,
	created_by uuid null,
	created_on timestamp null default now(),
	constraint pk_mu_user_id primary key (user_id),
	constraint un_mu_email_id unique (email_id),
	constraint fk_mu_created_by foreign key (created_by) references app.m_user(user_id),
	constraint fk_mu_deleted_by foreign key (deleted_by) references app.m_user(user_id),
	constraint fk_mu_updated_by foreign key (updated_by) references app.m_user(user_id)
);

create table app.m_secret (
	secret_id uuid not null default gen_random_uuid(),
	secret_title citext not null,
	secret_data text not null,
	tags varchar(25) array null,
	file_name varchar(100),
	file_mime_type varchar(100),	
	is_text boolean,
	secret_key text not null,
	secret_iv text not null,
	updated_by uuid null,
	updated_on timestamp null,
	deleted_by uuid null,	
	deleted_on timestamp null,
	created_by uuid null,
	created_on timestamp null default now(),
	constraint pk_MS_secret_id primary key (secret_id),
	constraint fk_ms_created_by foreign key (created_by) references app.m_user(user_id),
	constraint fk_ms_deleted_by foreign key (deleted_by) references app.m_user(user_id),
	constraint fk_ms_updated_by foreign key (updated_by) references app.m_user(user_id)
);

create table app.t_shared_secrets (
	id serial4 not null,
	user_id uuid not null,
	owner_id uuid not null,
	secret_id uuid not null,
	secret_data text not null,
	secret_key text not null,
	secret_iv text not null,
	updated_by uuid null,
	updated_on timestamp null,
	deleted_by uuid null,
	deleted_on timestamp null,
	created_by uuid null,
	created_on timestamp not null default now(),
	constraint pk_tk_id primary key (id),
	constraint fk_tk_user_id foreign key (user_id) references app.m_user(user_id),
	constraint fk_tk_owner_id foreign key (owner_id) references app.m_user(user_id),
	constraint fk_tk_secret_id foreign key (secret_id) references app.m_secret(secret_id),
	constraint fk_tk_created_by foreign key (created_by) references app.m_user(user_id),
	constraint fk_tk_deleted_by foreign key (deleted_by) references app.m_user(user_id),
	constraint fk_tk_updated_by foreign key (updated_by) references app.m_user(user_id)
);

create table app.t_log (
	id bigserial not null,
	request_url text null,
	api text null,
	ip inet null,
	input_params jsonb null,
	output_params jsonb null,
	remarks text null,
	error text null,
	called_by uuid null,
	started_on timestamp null,
	completed_on timestamp null,
	constraint pk_tl_id primary key (id)
);
create index ix_tl_request_url on app.t_log using btree (request_url);
create index ix_tl_api on app.t_log using btree (api);
create index ix_tl_ip on app.t_log using btree (ip);
create index ix_tl_error on app.t_log using btree (error);
create index ix_tl_called_by on app.t_log using btree (called_by);
create index ix_tl_started_on on app.t_log using btree (started_on);

-- Default password hashed below = 'Password@123'
INSERT INTO app.m_user (is_admin,first_name,email_id,pass,force_reset_pass) VALUES
	 (true,'Admin','admin@example.com','$argon2id$v=19$m=65536,t=3,p=4$Qz9Sn2iJubjxGpkni/pBXg$ajptIK1jzAmxmTe/ccBhhRWYC6n8msJrrz5yZyiS6h0',false);

CREATE VIEW vw_users_list as
select user_id, first_name, last_name, is_admin, email_id, phone, CASE WHEN pub_key IS NULL OR pub_key = '' THEN 0 ELSE 1 END AS pub_key, login_disabled_on, deleted_on from app.m_user AS MU ;

CREATE VIEW vw_secret_list as
select
ms.secret_id, ms.secret_title, array_to_string(ms.tags, ',') as tags, ms.file_name, ms.file_mime_type, ms.is_text, mu.is_admin, 1 as is_edit_allowed, ms.created_by as owner_id
from
m_secret ms 
join m_user mu on mu.user_id = ms.created_by 
union
select ms.secret_id, ms.secret_title, array_to_string(ms.tags, ',') as tags, ms.file_name, ms.file_mime_type, ms.is_text, mu.is_admin, 0 as is_edit_allowed, a.user_id as owner_id
from m_secret ms 
join m_user mu on mu.user_id = ms.created_by 
join t_shared_secrets a on a.secret_id = ms.secret_id ;	