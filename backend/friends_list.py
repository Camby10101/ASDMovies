class FriendsList:
    def __init__(self, owner):
        self.owner = owner
        self.friends = []

    def add_friend(self, user):
        if user == self.owner:
            raise ValueError("A user cannot be friends with themselves.")
        if user in self.friends:
            raise ValueError("User is already a friend.")
        self.friends.append(user)


    def remove_friend(self, user):
        if user in self.friends:
            self.friends.remove(user)

    def is_friend(self, user):
        return user in self.friends

    def get_friends(self):
        return self.friends

#Need to link with the user system and database
