import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TopBar,
  ProfileCard,
  FriendsCard,
  CustomButton,
  TextInput,
  Loading,
  PostCard,
  EditProfile,
} from "../components";

import { NoProfile } from "../assets";
import { Link } from "react-router-dom";
import { BsFiletypeGif, BsPersonFillAdd } from "react-icons/bs";
import { useForm } from "react-hook-form";
import { BiImages, BiSolidVideo } from "react-icons/bi";
import {
  apiRequest,
  deletePost,
  fetchPosts,
  handleFileUpload,
  likePost,
  sendFriendRequest,
  getUserInfo,
} from "../utils";
import { login } from "../redux/userSlice";

const Home = () => {
  const { user, edit } = useSelector((state) => state.user);
  const { posts } = useSelector((state) => state.posts);
  const [friendRequest, setFriendRequest] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [errMsg, setErrMsg] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const gifInputRef = useRef(null);

  const handleFileSelect = (e, type) => {
    const selectedFile = e.target.files[0];
    console.log("File selected:", selectedFile, "Type:", type);

    if (selectedFile) {
      // Validate file type
      const validTypes = {
        image: ["image/jpeg", "image/jpg", "image/png"],
        video: ["video/mp4", "video/wav"],
        gif: ["image/gif"],
      };

      if (!validTypes[type].includes(selectedFile.type)) {
        alert(`Please select a valid ${type} file`);
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }

      setFile(selectedFile);
      setFileType(type);

      // Create preview
      if (type === "image" || type === "gif") {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target.result);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(selectedFile);
      } else if (type === "video") {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target.result);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleFileButtonClick = (type) => {
    switch (type) {
      case "image":
        imageInputRef.current?.click();
        break;
      case "video":
        videoInputRef.current?.click();
        break;
      case "gif":
        gifInputRef.current?.click();
        break;
      default:
        break;
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const handlePostSubmit = async (data) => {
    setPosting(true);
    setErrMsg(" ");
    try {
      const uri = file && (await handleFileUpload(file));
      const newData = uri ? { ...data, image: uri } : data;
      const res = await apiRequest({
        url: "/posts/create-post",
        data: newData,
        token: user?.token,
        method: "POST",
      });
      if (res?.status === "failed") {
        setErrMsg(res);
      } else {
        reset({ description: "" });
        setFile(null);
        setFilePreview(null);
        setFileType(null);
        setErrMsg("");
        await fetchPost();
      }
      setPosting(false);
    } catch (error) {
      console.log(error);
      setPosting(false);
    }
  };

  const fetchPost = async () => {
    await fetchPosts(user?.token, dispatch);
    setLoading(false);
    console.log("posts", posts);
  };

  const handleLikePost = async (uri) => {
    await likePost(uri, user?.token);
    await fetchPost();
  };

  const handleDelete = async (id) => {
    await deletePost(id, user.token);
    await fetchPost();
  };

  const fetchFriendRequests = async () => {
    try {
      console.log("Fetching friend requests for user:", user?._id);
      const res = await apiRequest({
        url: "/users/get-friend-request",
        token: user?.token,
        method: "POST",
      });
      console.log("Friend requests response:", res);
      if (res?.success) {
        setFriendRequest(res?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSuggestedFriends = async () => {
    try {
      const res = await apiRequest({
        url: "/users/suggested-friends",
        token: user?.token,
        method: "POST",
      });
      setSuggestedFriends(res?.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFriendRequest = async (id) => {
    try {
      console.log("Sending friend request to user:", id);
      const res = await sendFriendRequest(user?.token, id);
      console.log("Friend request sent:", res);
      await fetchSuggestedFriends();
      // Refresh friend requests to show any new ones
      await fetchFriendRequests();
    } catch (error) {
      console.log(error);
    }
  };

  const acceptFriendRequest = async (id, status) => {
    try {
      const res = await apiRequest({
        url: "/users/accept-request",
        token: user?.token,
        method: "POST",
        data: { rid: id, status },
      });
      setFriendRequest(res?.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getUser = async () => {
    const res = await getUserInfo(user?.token);
    const newData = { token: user?.token, ...res };
    dispatch(login(newData));
  };

  useEffect(() => {
    setLoading(true);
    getUser();
    fetchPost();
    fetchFriendRequests();
    fetchSuggestedFriends();
    console.log("Home component mounted, fetching data...");
  }, []);

  return (
    <>
      <div className="home w-full px-0 lg:px-10 pb-20 2xl:px-40 bg-bgColor lg:rounded-lg h-screen overflow-hidden">
        <TopBar />
        <div className="w-full flex gap-2 lg:gap-4 pt-5 pb-10 h-full">
          {/* left */}
          <div className="hidden w-1/3 lg:1/4 h-full md:flex flex-col gap-6 overflow-y-auto">
            <ProfileCard user={user} />
            <FriendsCard friends={user?.friends} />
          </div>
          {/* center */}
          <div className="flex-1 h-full px-4 flex flex-col gap-6 overflow-y-auto rounded-lg">
            <form
              onSubmit={handleSubmit(handlePostSubmit)}
              className="bg-primary px-4 rounded-lg"
            >
              <div className="w-full flex items-center gap-2 py-4 border-b border-[#66666645]">
                <img
                  src={user?.profileUrl ?? NoProfile}
                  alt={user?.email}
                  className="w-14 h-14 object-cover rounded-full"
                />
                <TextInput
                  styles="w-full rounded-full py-5"
                  placeholder="What's on your mind..."
                  name="description"
                  register={register("description", {
                    required: "Write something about post",
                  })}
                  error={errors.description ? errors.description.message : ""}
                />
              </div>
              {errMsg?.message && (
                <span
                  className={`text-sm ${
                    errMsg?.status == "failed"
                      ? "text-[#f64949fe]"
                      : "text-[#2ba150fe]"
                  } mt-0.5`}
                >
                  {errMsg.message}
                </span>
              )}

              {/* File Preview Section */}
              {filePreview && (
                <div className="py-4 border-t border-[#66666645]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-ascent-1">
                      {fileType === "image"
                        ? "Image"
                        : fileType === "video"
                        ? "Video"
                        : "GIF"}{" "}
                      Preview
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="relative max-w-xs mx-auto">
                    {fileType === "image" || fileType === "gif" ? (
                      <img
                        src={filePreview}
                        alt="File Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : fileType === "video" ? (
                      <video
                        src={filePreview}
                        controls
                        className="w-full h-48 object-cover rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : null}

                    <div className="mt-2 text-center">
                      <span className="text-xs text-ascent-2">
                        {file?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Buttons */}
              <div className="flex items-center justify-between py-4">
                <button
                  type="button"
                  onClick={() => handleFileButtonClick("image")}
                  className="flex items-center gap-1 text-base text-ascent-2 hover:text-gray-700 cursor-pointer"
                >
                  <BiImages />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFileButtonClick("video")}
                  className="flex items-center gap-1 text-base text-ascent-2 hover:text-gray-700 cursor-pointer"
                >
                  <BiSolidVideo />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFileButtonClick("gif")}
                  className="flex items-center gap-1 text-base text-ascent-2 hover:text-gray-700 cursor-pointer"
                >
                  <BsFiletypeGif />
                  <span>Gif</span>
                </button>
                <div>
                  {posting ? (
                    <Loading />
                  ) : (
                    <CustomButton
                      type="submit"
                      title="Post"
                      containerStyles="bg-[#0444a4] text-white py-1 px-6 rounded-full font-semibold text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
                accept=".jpg, .png, .jpeg"
              />
              <input
                ref={videoInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "video")}
                accept=".mp4, .wav"
              />
              <input
                ref={gifInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "gif")}
                accept=".gif"
              />
            </form>
            {loading ? (
              <Loading />
            ) : posts?.length > 0 ? (
              posts?.map((post) => (
                <PostCard
                  key={post?._id}
                  post={post}
                  user={user}
                  deletePost={handleDelete}
                  likePost={handleLikePost}
                />
              ))
            ) : (
              <div className="flex w-full h-full items-center justify-center">
                <p className="text-lg text-ascent-2">No Post Found</p>
              </div>
            )}
          </div>
          {/* right */}
          <div className="hidden w-1/4 h-full lg:flex flex-col gap-8 overflow-y-auto">
            {/* friend req */}
            <div className="w-full bg-primary shadow-sm rounded-lg px-6 py-5">
              <div className="flex items-center justify-between text-xl text-ascent-1 pb-2 border-b border-[#66666645]">
                <span>Friend Request</span>
                <span>{friendRequest?.length}</span>
              </div>
              <div className="w-full flex flex-col gap-4 pt-4">
                {friendRequest?.map(({ _id, requestFrom: from }) => (
                  <div key={_id} className="flex items-center justify-between">
                    <Link
                      to={"/profile/" + from._id}
                      className="w-full flex gap-4 items-center cursor-pointer"
                    >
                      <img
                        src={from?.profileUrl ?? NoProfile}
                        alt={from?.firstName}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-base font-medium text-ascent-1">
                          {from?.firstName} {from?.lastName}
                        </p>
                        <span className="text-sm text-ascent-2">
                          {from?.profession ?? "No Profession"}
                        </span>
                      </div>
                    </Link>
                    <div className="flex gap-1">
                      <CustomButton
                        title="Accept"
                        onClick={() => acceptFriendRequest(_id, "Accepted")}
                        containerStyles="bg-[#0444a4] text-xs text-white px-1.5 py-1 rounded-full cursor-pointer"
                      />
                      <CustomButton
                        title="Deny"
                        onClick={() => acceptFriendRequest(_id, "Denied")}
                        containerStyles="border border-[#666] text-ascent-1 text-xs px-1.5 py-1 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* suggested friends */}
            <div className="w-full bg-primary shadow-sm rounded-lg px-5 py-5">
              <div className="flex items-center justify-between text-lg text-ascent-1 border-b border-[#66666645]">
                <span>Friend Suggestion</span>
              </div>
              <div className="w-full flex flex-col gap-4 pt-4">
                {suggestedFriends?.map((friend) => (
                  <div
                    className="flex items-center justify-between"
                    key={friend._id}
                  >
                    <Link
                      to={"/profile/" + friend._id}
                      key={friend?._id}
                      className="w-full flex gap-4 items-center cursor-pointer"
                    >
                      <img
                        src={friend?.profileUrl ?? NoProfile}
                        alt={friend?.firstName}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-base font-medium text-ascent-1">
                          {friend?.firstName} {friend?.lastName}
                        </p>
                        <span className="text-sm text-ascent-2">
                          {friend?.profession ?? "No Profession"}
                        </span>
                      </div>
                    </Link>
                    <div className="flex gap-1">
                      <button
                        className="bg-[#0444a4] text-sm text-white p-1 rounded cursor-pointer"
                        onClick={() => handleFriendRequest(friend?._id)}
                      >
                        <BsPersonFillAdd
                          size={20}
                          className="text-white"
                          style={{ color: "white" }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {edit && <EditProfile />}
    </>
  );
};

export default Home;