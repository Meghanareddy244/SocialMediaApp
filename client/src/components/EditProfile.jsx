  import React, { useState } from "react";
  import { useForm } from "react-hook-form";
  import { MdClose } from "react-icons/md";
  import { useSelector, useDispatch } from "react-redux";
  import { TextInput, Loading, CustomButton } from "../components";
  import { updateProfile,login } from "../redux/userSlice";
  import { apiRequest , handleFileUpload} from "../utils";
  const EditProfile = () => {
    const { user } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [errMsg, setErrMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [picture, setPicture] = useState(null);

    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      mode: "onChange",
      defaultValues: { ...user },
    });

    const onSubmit = async (data) => {
      setIsSubmitting(true);
      setErrMsg(" ");
      try {
        const uri = picture && (await handleFileUpload(picture));
        const {firstName,lastName,location,profession} = data;
        const res = await apiRequest({
          url: "/users/update-user",
          data: {
            firstName,
            lastName,
            location,
            profession,
            profileUrl: uri ? uri : user?.profileUrl,
          },
          token: user?.token,
          method: "POST",
        });
        if (res?.status === "failed") {
          setErrMsg(res);
        } else {
          setErrMsg(res);
          const newUser = {token : res?.token, ...res?.user};
          dispatch(login(newUser));
          setTimeout(() => {
            dispatch(updateProfile(false));
          },3000);
        }
        setIsSubmitting(false);
      } catch (error) {
        console.log(error);
        setIsSubmitting(false);
      }
    };

    const handleClose = () => {
      dispatch(updateProfile(false));
    };

    const handleSelect = () => {
      setPicture(e.target.files[0]);
    };

    return (
      // <>
      //   <div className="fixed inset-0 overflow-y-auto">
      //     <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      //       <div className="fixed inset-0  z-10 transition-opacity">
      //         <div className="absolute inset-0 bg-[#000] opacity-70"></div>
      //       </div>
      //       <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
      //       &#8203;
      //       <div
      //         className="inline-block z-50 align-bottom bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      //         role="dialog"
      //         aria-modal="true"
      //         aria-labelledby="modal-headline"
      //       >
      //         <div className="flex justify-between px-6 pt-5 pb-2">
      //           <label
      //             htmlFor="name"
      //             className="block font-medium text-xl text-ascent-1 text-left"
      //           >
      //             Edit Profile
      //           </label>
      //           <button className="text-ascent-1" onClick={handleClose}>
      //             <MdClose size={22} />
      //           </button>
      //         </div>
      //         <form
      //           className="px-4 sm:px-6 flex flex-col gap-3 2xl:gap-6"
      //           onSubmit={handleSubmit(onSubmit)}
      //         >
      //           <TextInput
      //             styles="w-full"
      //             label="First Name"
      //             placeholder="First Name"
      //             name="firstName"
      //             register={register("firstName", {
      //               required: "firstName is required",
      //             })}
      //             error={errors.firstName ? errors.firstName.message : ""}
      //           />

      //           <TextInput
      //             styles="w-full"
      //             label="Last Name"
      //             placeholder="Last Name"
      //             name="lastName"
      //             register={register("lastName", {
      //               required: "lastName do not match",
      //             })}
      //             error={errors.lastName ? errors.lastName.message : ""}
      //           />

      //           <TextInput
      //             styles="w-full"
      //             label="profession"
      //             placeholder="profession"
      //             name="profession"
      //             type="text"
      //             register={register("profession", {
      //               required: "profession is required",
      //             })}
      //             error={errors.profession ? errors.profession.message : ""}
      //           />

      //           <TextInput
      //             label="Location"
      //             styles="w-full"
      //             placeholder="Location"
      //             register={register("location", {
      //               required: "Location do not match",
      //             })}
      //             error={errors.location ? errors.location.message : ""}
      //           />
      //           <label
      //             className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
      //             htmlFor="imgUpload"
      //           >
      //             <input
      //               type="file"
      //               className=""
      //               id="imgUpload"
      //               onChange={(e) => handleSelect(e)}
      //               accept=".jpg .png .jpeg"
      //             />
      //           </label>

      //           {errMsg?.message && (
      //             <span
      //               className={`text-sm ${
      //                 errMsg?.status == "failed"
      //                   ? "text-[#f64949fe]"
      //                   : "text-[#2ba150fe]"
      //               } mt-0.5`}
      //             >
      //               {errMsg.message}
      //             </span>
      //           )}
      //           {isSubmitting ? (
      //             <Loading />
      //           ) : (
      //             <CustomButton
      //               type="submit"
      //               containerStyles={`inline-flex justify-center rounded-md px-8 py-3 text-sm font-medium text-white outline-none bg-blue-600`}
      //               title="Submit"
      //             />
      //           )}
      //         </form>
      //       </div>
      //     </div>
      //   </div>
      // </>
      <>
        {/* 1. OVERLAY: Semi-transparent black background. Has a lower z-index. */}
        <div className="fixed inset-0 bg-black/70 z-40"></div>

        {/* 2. MODAL CONTAINER: Sits on top of the overlay. Has a higher z-index. */}
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="inline-block align-bottom bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            {/* Modal Header */}
            <div className="flex justify-between px-6 pt-5 pb-2">
              <label
                htmlFor="name"
                className="block font-medium text-xl text-ascent-1 text-left"
              >
                Edit Profile
              </label>
              <button className="text-ascent-1" onClick={handleClose}>
                <MdClose size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              className="px-4 sm:px-6 flex flex-col gap-3 2xl:gap-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <TextInput
                styles="w-full"
                label="First Name"
                placeholder="First Name"
                name="firstName"
                register={register("firstName", {
                  required: "First Name is required",
                })}
                error={errors.firstName ? errors.firstName.message : ""}
              />
              <TextInput
                styles="w-full"
                label="Last Name"
                placeholder="Last Name"
                name="lastName"
                register={register("lastName", {
                  required: "Last Name is required",
                })}
                error={errors.lastName ? errors.lastName.message : ""}
              />
              <TextInput
                styles="w-full"
                label="Profession"
                placeholder="Profession"
                name="profession"
                register={register("profession", {
                  required: "Profession is required",
                })}
                error={errors.profession ? errors.profession.message : ""}
              />
              <TextInput
                label="Location"
                styles="w-full"
                placeholder="Location"
                name="location"
                register={register("location", {
                  required: "Location is required",
                })}
                error={errors.location ? errors.location.message : ""}
              />
              <label
                className="flex items-center gap-2 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
                htmlFor="imgUpload"
              >
                <input
                  type="file"
                  className="hidden"
                  id="imgUpload"
                  onChange={handleSelect}
                  accept=".jpg, .png, .jpeg"
                />
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  Choose File
                </span>
                <span className="text-ascent-2">
                  {picture ? picture.name : "No file chosen"}
                </span>
              </label>
              {errMsg?.message && (
                <span
                  className={`text-sm ${
                    errMsg?.status === "failed"
                      ? "text-red-500"
                      : "text-green-500"
                  } mt-0.5`}
                >
                  {errMsg.message}
                </span>
              )}
              <div className="py-5 sm:flex sm:flex-row-reverse border-t border-[#66666645]">
                {isSubmitting ? (
                  <Loading />
                ) : (
                  <CustomButton
                    type="submit"
                    containerStyles={`inline-flex justify-center rounded-md px-8 py-3 text-sm font-medium text-white outline-none bg-blue-600`}
                    title="Submit"
                  />
                )}
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };

  export default EditProfile;
