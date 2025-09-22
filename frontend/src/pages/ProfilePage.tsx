// import { useState } from "react";
import { Typography } from "@/components/ui/typography";
// import { InfoBox } from "@/components/ui/info-box";

import { useUser } from "@/hooks/useUser";
import { useProfile } from "@/hooks/useProfile";

const ProfilePage = () => {

    const { user, loading } = useUser();
    const userId = user?.user_id ?? ""; // empty string if user is null
    const { profile, profileLoading } = useProfile(userId);

    if (loading) console.log("Loading user");
    if (!user) console.log("User not found");
    else console.log("User ID:", user.user_id);

    if (profileLoading) console.log("Loading profile");
    if (!profile) console.log("Profile not found");
    else console.log("Profile ID:", profile.user_id);

    return(
        <>
            <div className="flex justify-center">
                <div className="w-1/2 min-h-screen">
                    <div className="flex flex-col items-center p-4 space-y-4">
                        <Typography size="h1" align="center">
                            Edit Profile
                        </Typography>
                        <img className="w-1/5 h-1/5 rounded-full mb-4"
                        />
                        <div className="w-full bg-gray-900 flex items-center justify-center p-2">
                            <Typography size="h1" align="center" color="white">
                                Name
                            </Typography>
                        </div>
                        
                        <Typography size="h2" align="center">
                            Bio
                        </Typography>
                    </div>  

                    <hr></hr>

                    <div className="flex flex-col items-center p-4 space-y-4">
                        <Typography size="h2" align="center">
                            Details
                        </Typography>
                        <Typography size="h3" align="center">
                            Email
                        </Typography>
                        {/* <InfoBox 
                            text={email}
                            maxLength={50}
                            size="small"
                            onChange={setEmail}
                            isEditable={true}
                        /> */}
                        <Typography size="h3" align="center">
                            Phone
                        </Typography>
                        {/* <InfoBox 
                            text={phone}
                            maxLength={9}
                            size="small"
                            onChange={setPhone}
                            isEditable={true}
                        /> */}
                    </div>

                    <hr></hr>
                    
                    
                </div>
            </div>
            

            
            
        </>
    );
}

export default ProfilePage;