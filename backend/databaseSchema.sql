CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE Movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

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

CREATE TABLE FavouritesLists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favouriteslists_user
        FOREIGN KEY (user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE
);


CREATE TABLE User_Ratings (
    user_id UUID NOT NULL,
    movie_id UUID NOT NULL,
    rated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, movie_id),

    CONSTRAINT fk_ratings_user
        FOREIGN KEY (user_id)
        REFERENCES profiles (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ratings_movie
        FOREIGN KEY (movie_id)
        REFERENCES Movies (id)
        ON DELETE CASCADE
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

CREATE TABLE FavouritesList_Movies (
    favourites_list_id UUID NOT NULL,
    movie_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (favourites_list_id, movie_id),

    CONSTRAINT fk_favlist_movies_list
        FOREIGN KEY (favourites_list_id)
        REFERENCES FavouritesLists (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favlist_movies_movie
        FOREIGN KEY (movie_id)
        REFERENCES Movies (id)
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

CREATE TABLE Group_Movie_Requests (
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

