-- This is a reference database schema for the project.

CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  handle TEXT
);

CREATE TABLE privacy_settings (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  profile_visibility BOOLEAN DEFAULT TRUE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  show_activity BOOLEAN DEFAULT TRUE,
  show_favorites_to TEXT DEFAULT 'friends',
  allow_tagging BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE blocked_users (
  user_id UUID REFERENCES auth.users(id),
  blocked UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, blocked)
);

CREATE TABLE Movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tmdb_id INT4,
    title TEXT,
    release_year INT4,
    genre TEXT,
    poster TEXT,
    rating NUMERIC,
    description TEXT
);

CREATE TABLE Groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    group_colour TEXT,

    CONSTRAINT fk_groups_creator
        FOREIGN KEY (creator_user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE
);

CREATE TABLE FriendLists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_friendlists_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE
);

CREATE TABLE favourite_movies (
    user_id UUID NOT NULL REFERENCES auth.users(id),
    movie_id INT4 NOT NULL,
    rank INT4,

    PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE user_movie_ratings (
    id INT8 PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tmdb_id INT4,
    user_id UUID REFERENCES auth.users(id),
    rating INT4
);

CREATE TABLE FriendList_Members (
    friend_list_id UUID NOT NULL,
    member_user_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (friend_list_id, member_user_id),

    CONSTRAINT fk_friendlist_members_list
        FOREIGN KEY (friend_list_id)
        REFERENCES FriendLists (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_friendlist_members_user
        FOREIGN KEY (member_user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE
);

CREATE TABLE Group_Members (
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, group_id),

    CONSTRAINT fk_group_members_user
        FOREIGN KEY (user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id)
        REFERENCES Groups (id)
        ON DELETE CASCADE
);

CREATE TABLE group_movie_requests (
    group_id UUID NOT NULL,
    movie_id UUID NOT NULL,
    requested_by_user_id UUID,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (group_id, movie_id),

    CONSTRAINT fk_requests_group
        FOREIGN KEY (group_id)
        REFERENCES Groups (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_requests_movie
        FOREIGN KEY (movie_id)
        REFERENCES Movies (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_requests_user
        FOREIGN KEY (requested_by_user_id)
        REFERENCES profiles (user_id)
        ON DELETE SET NULL
);